#!/bin/sh
set -e

echo "Running database migrations with drizzle-kit..."

MAX_RETRIES=10
SLEEP_SECONDS=3
COUNT=0

until ./node_modules/.bin/drizzle-kit push --config=drizzle.config.ts; do
  COUNT=$((COUNT + 1))
  if [ "$COUNT" -ge "$MAX_RETRIES" ]; then
    echo "Migrations failed after ${MAX_RETRIES} attempts, giving up."
    exit 1
  fi
  echo "Database not ready yet (attempt ${COUNT}), retrying in ${SLEEP_SECONDS}s..."
  sleep "$SLEEP_SECONDS"
done

echo "Starting application..."
npm start

