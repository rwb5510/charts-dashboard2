# --- Stage 1: Builder ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./

# If there's no package-lock.json, just run npm install
ARG NO_LOCKFILE=false
RUN if [ "$NO_LOCKFILE" = "true" ]; then npm install; else npm ci; fi

COPY . .
RUN npm run build || echo "No build script found — skipping."

# --- Stage 2: Runtime ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN if [ "$NO_LOCKFILE" = "true" ]; then npm install --omit=dev; else npm ci --only=production; fi

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/package*.json ./

EXPOSE 3000
CMD ["npm", "run", "start"]
