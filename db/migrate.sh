#!/bin/sh
# =====================================================================
# Loads the schema, reference data and curriculum into the database.
#
# Runs inside Railway, where DATABASE_URL is injected and the database
# is reachable on the private network. Nothing here needs a password
# typed anywhere or a connection string sent outside Railway.
#
# Safe to run repeatedly. Each file is recorded in schema_migrations
# once it succeeds, and already-applied files are skipped — so a restart
# or a redeploy does not try to load the curriculum twice.
#
# Set LOAD_DEMO_DATA=true to also load the sample cohorts and sessions.
# Leave it unset for anything real.
# =====================================================================

set -e

if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not set."
    echo
    echo "In Railway, open this service's Variables tab and add:"
    echo "    DATABASE_URL = \${{Postgres.DATABASE_URL}}"
    echo
    echo "Type it exactly like that, including the braces — Railway"
    echo "substitutes the real value at run time. If the Postgres"
    echo "service is named something other than 'Postgres', use its"
    echo "name instead."
    exit 1
fi

DIR="$(dirname "$0")"

echo "==================================================="
echo " Burkina training log — database setup"
echo "==================================================="
echo

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c "
    CREATE TABLE IF NOT EXISTS schema_migrations (
        filename    text        PRIMARY KEY,
        applied_at  timestamptz NOT NULL DEFAULT now()
    );"

apply() {
    file="$1"
    label="$2"

    applied=$(psql "$DATABASE_URL" -tA -c \
        "SELECT 1 FROM schema_migrations WHERE filename = '$file'")

    if [ "$applied" = "1" ]; then
        echo "  already done   $label"
        return 0
    fi

    echo "  loading        $label"
    # -o /dev/null discards row output from the load itself; errors still
    # surface on stderr and ON_ERROR_STOP still aborts the run.
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -o /dev/null -f "$DIR/$file"
    psql "$DATABASE_URL" -q -c \
        "INSERT INTO schema_migrations (filename) VALUES ('$file')"
    echo "  done           $label"
}

apply "schema.sql"              "tables, constraints and views"
apply "seed/01-reference.sql"   "teaching methods, disruption reasons, rubric"
apply "seed/02-curriculum.sql"  "four tracks, 83 lessons, 92 objectives"

if [ "$LOAD_DEMO_DATA" = "true" ]; then
    echo
    echo "  LOAD_DEMO_DATA is true — loading sample cohorts and sessions."
    echo "  Turn this off before any real data goes in."
    apply "demo/demo-data.sql"  "five demo cohorts and their sessions"
fi

echo
echo "---------------------------------------------------"
echo " What is in the database now"
echo "---------------------------------------------------"

psql "$DATABASE_URL" -c "
SELECT t.code AS track,
       count(DISTINCT m.id) AS modules,
       count(DISTINCT l.id) AS lessons,
       count(o.id)          AS objectives
  FROM track t
  LEFT JOIN module m    ON m.track_id  = t.id
  LEFT JOIN lesson l    ON l.module_id = m.id
  LEFT JOIN objective o ON o.lesson_id = l.id
 GROUP BY t.code, t.position
 ORDER BY t.position;"

if [ "$LOAD_DEMO_DATA" = "true" ]; then
    echo " Cohort positions — this is the handover sheet:"
    psql "$DATABASE_URL" -c "
    SELECT cohort_code, track_code, resume_lesson_code,
           last_instructor,
           lessons_covered || '/' || total_lessons AS progress
      FROM v_cohort_position
     ORDER BY cohort_code;"
fi

echo "==================================================="
echo " Setup complete."
echo
echo " This service has done its job. You can delete it,"
echo " or leave it — re-running it skips everything that"
echo " is already loaded."
echo "==================================================="
