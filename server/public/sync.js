/*
 * Getting queued entries to the server.
 *
 * Nothing here is allowed to lose an entry. The queue is the record; the
 * server is where it eventually goes. An entry leaves the queue only when
 * the server has confirmed it in writing — either "stored" or "already
 * received", the second being what a successful retry looks like.
 *
 * Sync is attempted on load, when the browser reports a connection, after
 * every save, when the app comes back to the foreground, and on a slow
 * timer. Cheap when there is nothing to send, harmless when offline.
 */

import { Store } from './store.js';

let syncing = false;
const listeners = new Set();

export const onSyncChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const announce = (state) => listeners.forEach((fn) => fn(state));

async function authHeaders() {
  const auth = await Store.getAuth();
  return auth ? { Authorization: `Bearer ${auth.token}` } : {};
}

/**
 * Push everything queued. Returns a short summary.
 *
 * Entries are sent in one batch. A phone that has been offline for three
 * days has three queued, and one request that reports per-entry results
 * beats three requests where the second fails halfway through.
 */
export async function sync({ silent = false } = {}) {
  if (syncing) return { skipped: 'already running' };
  const queued = (await Store.queueAll()).filter((e) => e.status !== 'rejected');
  if (!queued.length) {
    await refreshPositions();
    return { sent: 0 };
  }
  if (!navigator.onLine) return { offline: true, pending: queued.length };

  syncing = true;
  if (!silent) announce({ state: 'syncing', pending: queued.length });

  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify(queued.map((e) => e.payload)),
    });

    if (res.status === 401) {
      // The token is no longer good. Entries stay queued — they are not
      // the problem and must not be discarded because of a sign-in issue.
      announce({ state: 'signed-out', pending: queued.length });
      return { needsLogin: true, pending: queued.length };
    }

    if (!res.ok && res.status >= 500) {
      announce({ state: 'error', pending: queued.length });
      return { serverError: true, pending: queued.length };
    }

    const body = await res.json();
    let confirmed = 0;
    let rejected = 0;

    for (const r of body.results || []) {
      if (r.status === 'stored' || r.status === 'already_received') {
        await Store.queueRemove(r.id);
        confirmed++;
      } else if (r.status === 'rejected' || r.status === 'duplicate_day') {
        // Keep it, flagged. A rejected entry is one the instructor believes
        // they filed; silently dropping it means they get blamed for not
        // logging and nobody can trace why.
        const entry = queued.find((e) => e.id === r.id);
        if (entry) {
          entry.status = 'rejected';
          entry.problems = r.problems || [r.message];
          await Store.queueAdd(entry);
        }
        rejected++;
      }
    }

    await Store.setLastSync(new Date().toISOString());
    await refreshPositions();

    const pending = await Store.queueCount();
    announce({ state: 'idle', pending, justSent: confirmed, rejected });
    return { sent: confirmed, rejected, pending };
  } catch (err) {
    // Network failure. Everything stays queued. This is the normal case in
    // the field, not an error worth alarming anyone about.
    announce({ state: 'offline', pending: queued.length });
    return { offline: true, pending: queued.length };
  } finally {
    syncing = false;
  }
}

/** Pull the server's view of where each cohort stands. */
async function refreshPositions() {
  if (!navigator.onLine) return;
  try {
    const res = await fetch('/api/bootstrap?lang=fr', { headers: await authHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    await Store.setBootstrap(data);
    const positions = {};
    for (const c of data.cohorts) {
      if (c.position) positions[c.code] = c.position;
    }
    await Store.mergePositions(positions);
  } catch {
    /* offline; the cache stands */
  }
}

/** Start the background attempts. Called once, at startup. */
export function startSyncLoop() {
  sync({ silent: true });
  window.addEventListener('online', () => sync());
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) sync({ silent: true });
  });
  // Slow enough not to drain a battery, often enough that a connection
  // appearing for a minute in a courtyard is caught.
  setInterval(() => sync({ silent: true }), 60000);
}
