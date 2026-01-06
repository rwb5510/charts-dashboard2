# Charts Dashboard2

This is a simple web application that provides a dashboard for managing patient lists. It uses a Node.js backend with Express and a SQLite database for persistence.

## Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/charts-dashboard.git
    cd charts-dashboard
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```

## Running the Application

### Locally

To run the application locally, use the following command:

```bash
npm start
```

The server will start on port 3000. You can access the application by navigating to `http://localhost:3000` in your web browser.

### With Docker

To build and run the application with Docker, use the following commands:

```bash
docker build -t charts-dashboard .
docker run -p 3000:3000 charts-dashboard
```

The application will be accessible at `http://localhost:3000`.

## API Endpoints

### `GET /api/state`

Retrieves the current application state, including patient lists and tags.

-   **Response:**
    -   `200 OK`: with a JSON object representing the application state.
    -   `500 Internal Server Error`: if there is an error loading the state.

### `POST /api/state`

Saves the application state.

-   **Request Body:** A JSON object representing the application state.
-   **Response:**
    -   `204 No Content`: if the state is saved successfully.
    -   `400 Bad Request`: if the request body is invalid.
    -   `500 Internal Server Error`: if there is an error saving the state.
