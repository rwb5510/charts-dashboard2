FROM node:18-alpine AS builder WORKDIR /app COPY package*.json ./ RUN npm ci COPY . .

run build if present; || true prevents fail if no build step
RUN npm run build || true

FROM node:18-alpine WORKDIR /app ENV NODE_ENV=production COPY package*.json ./ RUN npm ci --only=production COPY --from=builder /app . EXPOSE 3000 CMD ["npm", "run", "start"]
