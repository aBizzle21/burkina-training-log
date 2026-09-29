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

# ---------------------------------------------------------------------
# Starting the database over.
#
# Needed once: a database built on the first curriculum cannot be
# upgraded to this one in place. The old lesson codes were reused for
# different lessons, and the schema refuses to rewrite a lesson that has
# already been taught — rightly, because past sessions say they covered
# the lesson those codes used to mean.
#
# Two conditions, both required, so this cannot erase anything real:
#   RESET_DATABASE = yes-erase-everything   — deliberate, not a typo
#   LOAD_DEMO_DATA = true                   — the service is in demo mode
#
# The second is the interlock that matters. Turning demo mode off is the
# step that marks a database as carrying real records, and from that
# point this switch refuses to do anything at all.
# ---------------------------------------------------------------------
if [ -n "$RESET_DATABASE" ]; then
    if [ "$RESET_DATABASE" != "yes-erase-everything" ]; then
        echo "ERROR: RESET_DATABASE is set to something unexpected."
        echo
        echo "  To erase and rebuild, it must read exactly:"
        echo "      yes-erase-everything"
        echo
        echo "  To leave the database alone, delete the variable."
        exit 1
    fi
    if [ "$LOAD_DEMO_DATA" != "true" ]; then
        echo "ERROR: refusing to erase this database."
        echo
        echo "  RESET_DATABASE is set, but LOAD_DEMO_DATA is not 'true',"
        echo "  which means this database is being treated as holding real"
        echo "  records. Erasing is only allowed while the service is"
        echo "  explicitly in demo mode."
        echo
        echo "  If the records really are disposable, set LOAD_DEMO_DATA"
        echo "  to true as well. If they are not, delete RESET_DATABASE."
        exit 1
    fi

    echo "  RESET_DATABASE is set and this service is in demo mode."
    echo "  Erasing every table and rebuilding from scratch."
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q \
        -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    echo "  erased         everything"
    echo
    echo "  >>> Remove the RESET_DATABASE variable in Railway now. <<<"
    echo "  >>> Left in place, it erases the database on every"
    echo "  >>> redeploy for as long as demo mode stays on."
    echo
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c "
    CREATE TABLE IF NOT EXISTS schema_migrations (
        filename    text        PRIMARY KEY,
        applied_at  timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS checksum text;"

# ---------------------------------------------------------------------
# Two kinds of file, and the difference matters.
#
# A structural file is applied once, ever. schema.sql creates tables; run
# it twice and the second run fails.
#
# A content file is regenerated from the curriculum, and its whole point
# is that it changes. Every statement in one is an upsert, and lessons
# that are no longer authored are retired rather than deleted, so
# re-running it is the intended way to publish a curriculum change.
#
# Tracking those by filename alone was wrong, and quietly so: the seed
# files keep their names when their contents change, so a database that
# had loaded an earlier curriculum would skip the new one and keep
# serving the old lessons under the new schema. Content files are
# therefore tracked by a checksum of the file, and re-applied when it
# moves. Rows written before this change have no checksum, which reads
# as "changed" — which is right, because nothing knows what they held.
# ---------------------------------------------------------------------

sum_of() {
    # Any stable hash will do; md5sum is in busybox, coreutils and alpine.
    md5sum "$1" 2>/dev/null | cut -d' ' -f1 || cksum "$1" | cut -d' ' -f1
}

apply_once() {
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
        "INSERT INTO schema_migrations (filename, checksum)
         VALUES ('$file', '$(sum_of "$DIR/$file")')
         ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum"
    echo "  done           $label"
}

apply_sync() {
    file="$1"
    label="$2"
    now=$(sum_of "$DIR/$file")

    was=$(psql "$DATABASE_URL" -tA -c \
        "SELECT COALESCE(checksum, '') FROM schema_migrations
          WHERE filename = '$file'")

    if [ "$was" = "$now" ]; then
        echo "  unchanged      $label"
        return 0
    fi

    if [ -n "$was" ]; then
        echo "  updating       $label"
    else
        echo "  loading        $label"
    fi
    # The interesting failure here is the schema refusing to rewrite a
    # lesson that has already been taught. That is not a fault to work
    # around — it is the one rule protecting what past sessions claim to
    # have covered — but the raw error says nothing useful to whoever is
    # watching a deploy log, so it gets explained.
    if ! psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -o /dev/null -f "$DIR/$file"; then
        echo
        echo "  ---------------------------------------------------"
        echo "  The load stopped, and the message above says why."
        echo
        echo "  If it says a lesson 'has already been taught and"
        echo "  cannot be rewritten', this database was built on an"
        echo "  older curriculum that used the same lesson codes for"
        echo "  different lessons. It cannot be upgraded in place:"
        echo "  sessions already recorded say they taught the lesson"
        echo "  that code used to mean, and overwriting it would"
        echo "  quietly change what those records claim."
        echo
        echo "  If this database holds nothing but demo data, start"
        echo "  it over: add RESET_DATABASE = yes-erase-everything"
        echo "  in Railway alongside LOAD_DEMO_DATA = true, redeploy"
        echo "  once, then delete RESET_DATABASE again."
        echo
        echo "  If it holds real sessions, do not do that. The old"
        echo "  lessons need retiring rather than replacing, which"
        echo "  is a change to the curriculum files, not a setting."
        echo "  ---------------------------------------------------"
        exit 1
    fi
    psql "$DATABASE_URL" -q -c \
        "INSERT INTO schema_migrations (filename, checksum, applied_at)
         VALUES ('$file', '$now', now())
         ON CONFLICT (filename) DO UPDATE
            SET checksum = EXCLUDED.checksum, applied_at = now()"
    echo "  done           $label"
}

apply_once "schema.sql"                  "tables, constraints and views"
apply_once "migrations/002-pathways.sql" "pathways: levels, paces and cohort filters"
apply_sync "seed/01-reference.sql"       "levels, paces, teaching methods, rubric"
apply_sync "seed/02-curriculum.sql"      "foundation plus four branches, 152 lessons, 163 objectives"

if [ "$LOAD_DEMO_DATA" = "true" ]; then
    echo
    echo "  LOAD_DEMO_DATA is true — loading sample cohorts and sessions."
    echo "  Turn this off before any real data goes in."
    apply_sync "demo/demo-data.sql"  "five demo cohorts and their sessions"
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
echo " Database ready. Starting the server."
echo
echo " This runs on every deploy. Structure is applied"
echo " once; the curriculum is re-applied whenever its"
echo " file changes, and skipped when it has not."
if [ -n "$RESET_DATABASE" ]; then
    echo
    echo " RESET_DATABASE is still set. Delete it in Railway"
    echo " or the next redeploy erases this database again."
fi
echo "==================================================="
