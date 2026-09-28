# =====================================================================
# The training log server.
#
# Runs database migrations on start, then serves the API and the
# instructor app. Migrations are idempotent — anything already loaded is
# skipped — so a redeploy is safe and needs no separate step.
#
# This replaces the bootstrap-only image. The migration service that was
# used to load the schema can now be deleted from Railway.
# =====================================================================

FROM node:20-alpine

# psql, for db/migrate.sh on start
RUN apk add --no-cache postgresql16-client

WORKDIR /app

# Dependencies first, so a code change does not reinstall them.
COPY server/package.json ./server/
RUN cd server && npm install --omit=dev --no-audit --no-fund

COPY db/ ./db/
COPY server/ ./server/
RUN chmod +x ./db/migrate.sh

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "./db/migrate.sh && node server/src/index.js"]
