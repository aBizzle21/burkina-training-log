/*
 * Instructor identification.
 *
 * A personal code rather than SMS: SMS costs money per message and
 * delivers unreliably in-country, and a code can be reissued in person by
 * a site lead with no telco involved. See docs/open-decisions.md #3 —
 * this is the leaning, not a settled decision, so it is kept small and
 * easy to replace.
 *
 * The code is exchanged once for a token the device keeps. Performance is
 * attributed to named people here, so a shared token would make the whole
 * oversight layer meaningless.
 *
 * NOT FINISHED. The token is a signed value with no expiry and codes are
 * compared in plain text. That is acceptable for a pilot on a private
 * deployment and is not acceptable once real instructor records exist.
 * What is missing is written up in docs/open-decisions.md.
 */

const crypto = require('crypto');
const { query } = require('./db');

const SECRET =
  process.env.SESSION_SECRET ||
  (process.env.NODE_ENV === 'production'
    ? null
    : 'development-only-secret-do-not-use-in-production');

if (!SECRET) {
  console.error('SESSION_SECRET is not set. Refusing to start in production without it.');
  console.error('On Railway: add SESSION_SECRET to this service, any long random string.');
  process.exit(1);
}

function sign(instructorId) {
  const payload = Buffer.from(JSON.stringify({ id: instructorId })).toString('base64url');
  const mac = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${mac}`;
}

function verify(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, mac] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  // Length check first: timingSafeEqual throws on a length mismatch.
  if (mac.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).id;
  } catch {
    return null;
  }
}

/** POST /api/login — exchange a personal code for a token. */
async function login(req, res, next) {
  try {
    const code = (req.body && req.body.code ? String(req.body.code) : '').trim();
    if (!code) return res.status(400).json({ error: 'A personal code is required.' });

    const { rows } = await query(
      `SELECT id, full_name FROM instructor
        WHERE login_code = $1 AND active AND ended_on IS NULL`,
      [code]
    );
    if (!rows.length) {
      // Deliberately vague: it should not be possible to discover valid
      // codes by trying them and reading the difference in the replies.
      return res.status(401).json({ error: 'That code was not recognised.' });
    }

    res.json({
      token: sign(rows[0].id),
      instructor: { id: rows[0].id, name: rows[0].full_name },
    });
  } catch (err) {
    next(err);
  }
}

/** Middleware: require a valid token, and attach the instructor to the request. */
async function requireInstructor(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const id = token && verify(token);
    if (!id) return res.status(401).json({ error: 'Sign in again.' });

    const { rows } = await query(
      `SELECT id, full_name, role FROM instructor
        WHERE id = $1 AND active AND ended_on IS NULL`,
      [id]
    );
    // An instructor who has left stops being able to file immediately,
    // without anything of theirs being deleted or reassigned.
    if (!rows.length) return res.status(401).json({ error: 'This account is no longer active.' });

    req.instructor = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { login, requireInstructor, sign, verify };
