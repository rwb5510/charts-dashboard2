# --- Stage 1: Build ---
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependency manifests first (caching optimization)
COPY package*.json ./

RUN npm ci

# Copy source files
COPY . .

# Run build if it exists; the "|| true" prevents failure if no build step
RUN npm run build || true

# --- Stage 2: Runtime ---
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

# Copy the build output and app files from builder
COPY --from=builder /app ./

EXPOSE 3000
CMD ["npm", "run", "start"]
