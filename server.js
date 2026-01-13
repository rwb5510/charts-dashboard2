const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIRECTORY = path.join(__dirname, 'public');

app.use(express.json({ limit: '25mb' }));
app.use(express.static(PUBLIC_DIRECTORY));

let pool;

/**
 * Initialises the database pool and creates necessary tables.
 * @returns {Promise<void>}
 */
async function initialiseDatabase() {
    pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'charts_db',
    });

    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS patient_lists (
                dos TEXT PRIMARY KEY,
                data TEXT NOT NULL
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS settings (
                name TEXT PRIMARY KEY,
                values_json TEXT NOT NULL
            );
        `);
    } finally {
        client.release();
    }
}

/**
 * Loads the application state from the database.
 * @returns {Promise<object>} A promise that resolves with the application state.
 */
async function loadState() {
    const { rows: patientRows } = await pool.query('SELECT dos, data FROM patient_lists ORDER BY dos');
    const { rows: settingsRows } = await pool.query('SELECT name, values_json FROM settings');

    const patientLists = {};
    for (const row of patientRows) {
        try {
            patientLists[row.dos] = JSON.parse(row.data);
        } catch (error) {
            console.warn(`Unable to parse patient list for ${row.dos}:`, error);
            patientLists[row.dos] = [];
        }
    }

    const settings = {};
    for (const row of settingsRows) {
        try {
            settings[row.name] = JSON.parse(row.values_json);
        } catch (error) {
            console.warn(`Unable to parse settings value for ${row.name}:`, error);
            settings[row.name] = [];
        }
    }

    return {
        patientLists,
        reasonTags: settings.reasonTags || [],
        resultsNeededTags: settings.resultsNeededTags || [],
        visitTypeTags: settings.visitTypeTags || [],
        slotDurations: settings.slotDurations || {},
        hidePastDates: settings.hidePastDates || false,
        dateFilter: settings.dateFilter || { start: null, end: null },
    };
}

/**
 * Persists the application state to the database.
 * @param {object} state - The application state to persist.
 * @returns {Promise<void>}
 */
async function persistState({ patientLists, reasonTags, resultsNeededTags, visitTypeTags, slotDurations, hidePastDates, dateFilter }) {
    if (typeof patientLists !== 'object' || patientLists === null || Array.isArray(patientLists)) {
        throw new Error('Invalid patientLists payload');
    }

    const serialisedSettings = [
        ['reasonTags', Array.isArray(reasonTags) ? reasonTags : []],
        ['resultsNeededTags', Array.isArray(resultsNeededTags) ? resultsNeededTags : []],
        ['visitTypeTags', Array.isArray(visitTypeTags) ? visitTypeTags : []],
        ['slotDurations', (slotDurations && typeof slotDurations === 'object') ? slotDurations : {}],
        ['hidePastDates', hidePastDates],
        ['dateFilter', dateFilter],
    ];

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query('DELETE FROM patient_lists');
        const insertPatient = 'INSERT INTO patient_lists (dos, data) VALUES ($1, $2)';
        for (const [dos, patients] of Object.entries(patientLists)) {
            await client.query(insertPatient, [dos, JSON.stringify(Array.isArray(patients) ? patients : [])]);
        }

        await client.query('DELETE FROM settings');
        const insertSetting = 'INSERT INTO settings (name, values_json) VALUES ($1, $2)';
        for (const [name, values] of serialisedSettings) {
            await client.query(insertSetting, [name, JSON.stringify(values)]);
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Route to get the current application state.
 */
app.get('/api/state', async (req, res) => {
    try {
        const state = await loadState();
        res.json(state);
    } catch (error) {
        console.error('Failed to load application state:', error);
        res.status(500).json({ error: 'Failed to load application state.' });
    }
});

/**
 * Route to save the application state.
 */
app.post('/api/state', async (req, res) => {
    try {
        await persistState(req.body || {});
        res.status(204).end();
    } catch (error) {
        console.error('Failed to save application state:', error);
        const statusCode = error.message === 'Invalid patientLists payload' ? 400 : 500;
        res.status(statusCode).json({ error: error.message || 'Failed to save application state.' });
    }
});

/**
 * Catch-all route to serve the main index.html file for any non-API routes.
 */
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(PUBLIC_DIRECTORY, 'index.html'));
});

// Start the server only after ensuring DB connection logic is set up.
// Note: We might want a retry logic here for container startup timing,
// but Docker 'restart: always' or 'depends_on' helps.
initialiseDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to start server/database:', error);
        process.exit(1);
    });
