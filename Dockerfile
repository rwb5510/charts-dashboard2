# --- Stage 1: Builder ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
ARG NO_LOCKFILE=false
RUN if [ "$NO_LOCKFILE" = "true" ]; then npm install; else npm ci; fi

COPY . .

# --- Stage 2: Runtime ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

ARG NO_LOCKFILE=false
COPY package*.json ./
RUN if [ "$NO_LOCKFILE" = "true" ]; then npm install --omit=dev; else npm ci --only=production; fi

# Copy everything you actually need
COPY --from=builder /app ./

EXPOSE 3000
CMD ["npm", "run", "start"]
