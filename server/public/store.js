/*
 * Device storage.
 *
 * Everything the app knows lives here, in IndexedDB. The rule the whole
 * design rests on: an entry is written to this device BEFORE any network
 * call is attempted, and it is not removed until the server has confirmed
 * it. A connection that fails, or never comes, loses nothing.
 *
 * IndexedDB rather than localStorage because localStorage can be cleared
 * under memory pressure on a phone and gives no way to know it happened.
 *
 * Three stores:
 *   cache  — the curriculum and cohort list, as last fetched
 *   queue  — entries written here, not yet confirmed by the server
 *   meta   — the sign-in token, the current draft, local positions
 */

const DB_NAME = 'training-log';
const DB_VERSION = 1;

let dbPromise = null;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache');
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let req;
    try {
      req = fn(s);
    } catch (err) {
      reject(err);
      return;
    }
    // Resolve with the request's own result, always.
    //
    // An earlier version read `req.result !== undefined ? req.result : req`,
    // which handed back the IDBRequest object whenever a key was missing.
    // That object is truthy, so "is there a sign-in token?" answered yes on
    // a device that had never signed in, the app skipped the login screen,
    // and then rendered a blank page. A missing key must read as undefined.
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

const get = (store, key) =>
  tx(store, 'readonly', (s) => s.get(key)).then((r) => (r === undefined ? null : r));

const put = (store, key, value) =>
  tx(store, 'readwrite', (s) => (key === undefined ? s.put(value) : s.put(value, key)));

const del = (store, key) => tx(store, 'readwrite', (s) => s.delete(key));

const all = (store) => tx(store, 'readonly', (s) => s.getAll());

export const Store = {
  /* ---- interface language ---- */
  // Chosen once and kept. The curriculum is cached in both languages, so
  // switching never needs a connection.
  getLang: () => get('meta', 'lang'),
  setLang: (code) => put('meta', 'lang', code),

  /* ---- the sign-in token ---- */
  getAuth: () => get('meta', 'auth'),
  setAuth: (auth) => put('meta', 'auth', auth),
  clearAuth: () => del('meta', 'auth'),

  /* ---- the cached curriculum and cohort list ---- */
  getBootstrap: () => get('cache', 'bootstrap'),
  setBootstrap: (data) => put('cache', 'bootstrap', data),

  /* ---- the entry currently being filled in ---- */
  // Written on every change. If the battery dies mid-entry, nothing typed
  // is lost — which matters more than it sounds when the alternative is
  // an instructor re-doing a form at the end of a long day.
  getDraft: () => get('meta', 'draft'),
  setDraft: (draft) => put('meta', 'draft', draft),
  clearDraft: () => del('meta', 'draft'),

  /* ---- entries waiting to reach the server ---- */
  queueAdd: (entry) => put('queue', undefined, entry),
  queueAll: () => all('queue'),
  queueRemove: (id) => del('queue', id),
  async queueCount() {
    return (await all('queue')).filter((e) => e.status !== 'rejected').length;
  },

  /* ---- where each cohort has got to, as this device understands it ---- */
  // Updated locally the moment an entry is saved, so a phone that is
  // offline for a week still shows the right resume point each morning.
  // The server's view replaces this whenever a sync succeeds.
  getPositions: async () => (await get('meta', 'positions')) || {},
  async setPosition(cohortCode, lessonCode, date) {
    const positions = (await get('meta', 'positions')) || {};
    positions[cohortCode] = { resume_lesson_code: lessonCode, last_session_date: date };
    await put('meta', 'positions', positions);
  },
  async mergePositions(serverPositions) {
    const positions = (await get('meta', 'positions')) || {};
    for (const [code, p] of Object.entries(serverPositions)) {
      const local = positions[code];
      // The device wins when it holds an entry the server has not seen yet.
      if (!local || !local.last_session_date ||
          (p.last_session_date && p.last_session_date >= local.last_session_date)) {
        positions[code] = p;
      }
    }
    await put('meta', 'positions', positions);
  },

  getLastSync: () => get('meta', 'lastSync'),
  setLastSync: (when) => put('meta', 'lastSync', when),
};

/** A UUID generated on this device, so a retry is recognised as a retry. */
export function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  // Older WebViews: build a v4 by hand rather than fail.
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
