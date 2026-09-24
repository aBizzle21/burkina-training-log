# =====================================================================
# Bootstrap image — loads the database schema and curriculum.
#
# This is not the application. There is no server yet. This image
# exists so that Railway can run db/migrate.sh from inside its own
# network, where the database is reachable and no connection string
# has to leave Railway.
#
# When a real server arrives, replace this file with the server's
# Dockerfile and run migrations as a release step instead.
# =====================================================================

FROM postgres:16-alpine

WORKDIR /app
COPY db/ ./db/
RUN chmod +x ./db/migrate.sh

CMD ["./db/migrate.sh"]
