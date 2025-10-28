# =========================
# Stage 1: Builder
# =========================
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies first (caches efficiently)
COPY package*.json ./
RUN npm ci

# Copy all app files and build if script exists
COPY . .
RUN npm run build || echo "No build script found — skipping."

# =========================
# Stage 2: Runtime
# =========================
FROM node:18-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copy only the essentials for runtime
COPY package*.json ./
RUN npm ci --only=production

# Copy build artifacts (if any) and essential files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/package*.json ./

# Optional: add non-root user for security
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["npm", "run", "start"]
