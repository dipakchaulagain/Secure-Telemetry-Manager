FROM node:22-alpine AS builder

WORKDIR /app

# Install ALL dependencies (including dev) for building
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build client + server
COPY . .
RUN npm run build && cp node_modules/connect-pg-simple/table.sql dist/table.sql

FROM node:22-alpine AS runner

WORKDIR /app

# Install all dependencies (including dev) so tools like drizzle-kit are available
COPY package.json package-lock.json ./
RUN npm ci

# Install tzdata for timezone support
RUN apk add --no-cache tzdata

# Copy built artifacts and required runtime files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server ./server
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

EXPOSE 5000
ENV PORT=5000

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

CMD ["./docker-entrypoint.sh"]

