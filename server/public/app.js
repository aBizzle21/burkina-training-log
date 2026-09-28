/*
 * The instructor app.
 *
 * Reads from the device, writes to the device, and lets sync.js worry
 * about the server. Nothing in here waits on a network call before
 * telling an instructor their entry is saved, because on a bad connection
 * that wait is how entries get lost.
 */

import { Store, newId } from './store.js';
import { sync, onSyncChange, startSyncLoop } from './sync.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let boot = null;        // cached curriculum + cohorts
let auth = null;        // { token, instructor }
let positions = {};     // cohort code -> resume point, device's view
let draftTimer = null;
let started = null;     // when this entry was begun, for the timer

const form = {
  cohort_code: null,
  session_date: new Date().toISOString().slice(0, 10),
  present_count: '',
  lessons: new Set(),
  resume: null,
  methods: new Set(),
  dominant: '',
  objectives: {},
  disruption: '',
  flag_note: '',
};

/* ================= startup ================= */

/**
 * Show something useful when the app cannot start.
 *
 * A blank screen is the worst failure this app can have: an instructor in
 * Koudougou has no console, no way to describe what they are seeing, and
 * no reason to think the problem is not theirs. Anything that stops
 * startup must say so on screen and offer a way out.
 */
function fatal(message, detail) {
  document.getElementById('login').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  $('form').innerHTML = `
    <div class="position" style="border-color:var(--tampon)">
      <p class="etiq">L'application n'a pas pu démarrer</p>
      <p class="lecon" style="font-size:16px">${esc(message)}</p>
      ${detail ? `<p class="mod" style="word-break:break-word">${esc(detail)}</p>` : ''}
      <p class="meta">Vos séances enregistrées ne sont pas perdues.</p>
    </div>
    <div class="actions">
      <button class="primaire" id="btnRetry">Réessayer</button>
      <button class="primaire" id="btnReset"
              style="background:var(--tampon);margin-top:10px">
        Se reconnecter
      </button>
    </div>`;
  $('btnRetry').onclick = () => location.reload();
  $('btnReset').onclick = async () => {
    // Clears the sign-in only. The queue of unsent sessions is deliberately
    // left alone — it is the one thing that must never be thrown away to
    // fix a display problem.
    await Store.clearAuth();
    await Store.clearDraft();
    location.reload();
  };
}

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled:', e.reason);
});

async function start() {
  auth = await Store.getAuth();
  boot = await Store.getBootstrap();
  positions = await Store.getPositions();

  // A stored sign-in from an older, broken version may not have the shape
  // the app expects. Treat anything malformed as not signed in rather than
  // proceeding into a crash.
  if (auth && (!auth.token || !auth.instructor || !auth.instructor.name)) {
    await Store.clearAuth();
    auth = null;
  }

  if (!auth) return showLogin();

  // No cached curriculum and no connection is the one genuinely stuck
  // state. Everything else works offline.
  if (!boot) {
    const ok = await fetchBootstrap();
    if (!ok) {
      $('login').classList.remove('hidden');
      $('loginErr').textContent =
        "Première utilisation : une connexion est nécessaire une seule fois " +
        "pour télécharger le programme. Réessayez près d'un réseau.";
      return;
    }
  }

  // Awaited. An earlier version did not await this, so an exception inside
  // it was swallowed while the rest of startup carried on — which is how a
  // broken app still painted its header and status bar over an empty page.
  await showApp();

  startSyncLoop();
  onSyncChange(paintBar);
  paintBar({ state: navigator.onLine ? 'idle' : 'offline' });
  window.addEventListener('online', () => paintBar({ state: 'idle' }));
  window.addEventListener('offline', () => paintBar({ state: 'offline' }));

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

async function fetchBootstrap() {
  try {
    const res = await fetch('/api/bootstrap?lang=fr', {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (!res.ok) return false;
    boot = await res.json();
    await Store.setBootstrap(boot);
    const p = {};
    for (const c of boot.cohorts) if (c.position) p[c.code] = c.position;
    await Store.mergePositions(p);
    positions = await Store.getPositions();
    return true;
  } catch {
    return false;
  }
}

/* ================= sign in ================= */

function showLogin() {
  $('login').classList.remove('hidden');
  $('app').classList.add('hidden');
  $('loginBtn').onclick = doLogin;
  $('code').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
  $('code').focus();
}

async function doLogin() {
  const code = $('code').value.trim();
  if (!code) return;
  $('loginErr').textContent = '';
  $('loginBtn').disabled = true;
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      $('loginErr').textContent = "Ce code n'a pas été reconnu.";
      return;
    }
    auth = await res.json();
    await Store.setAuth(auth);
    await fetchBootstrap();
    $('login').classList.add('hidden');
    location.reload();
  } catch {
    $('loginErr').textContent =
      'Connexion indisponible. Réessayez lorsque le réseau revient.';
  } finally {
    $('loginBtn').disabled = false;
  }
}

/* ================= main screen ================= */

async function showApp() {
  $('login').classList.add('hidden');
  $('app').classList.remove('hidden');
  $('who').textContent = auth.instructor.name;

  const draft = await Store.getDraft();
  if (draft) {
    Object.assign(form, draft, {
      lessons: new Set(draft.lessons || []),
      methods: new Set(draft.methods || []),
    });
  }
  if (!form.cohort_code && boot.cohorts.length) {
    form.cohort_code = boot.cohorts[0].code;
  }
  if (!started) started = Date.now();

  render();
  setInterval(tickTimer, 1000);
}

const cohort = () => boot.cohorts.find((c) => c.code === form.cohort_code);
const track = () => boot.tracks.find((t) => t.code === cohort()?.track_code);
const lessonByCode = (code) => track()?.lessons.find((l) => l.code === code);

function resumePoint() {
  const p = positions[form.cohort_code];
  if (p && p.resume_lesson_code) return p;
  const first = track()?.lessons[0];
  return { resume_lesson_code: first?.code, last_session_date: null, fresh: true };
}

function nextLesson(code) {
  const list = track()?.lessons || [];
  const i = list.findIndex((l) => l.code === code);
  return i >= 0 && i < list.length - 1 ? list[i + 1].code : code;
}

function render() {
  const co = cohort();
  const tr = track();
  if (!co || !tr) {
    $('form').innerHTML = '<p class="vide">Aucune cohorte disponible.</p>';
    return;
  }

  const rp = resumePoint();
  const lec = lessonByCode(rp.resume_lesson_code) || tr.lessons[0];
  if (!form.resume) form.resume = rp.resume_lesson_code;

  // lesson checklist, grouped by module
  let lessonsHtml = '';
  let lastModule = null;
  for (const l of tr.lessons) {
    if (l.module.code !== lastModule) {
      lessonsHtml += `<div class="modrow">${esc(l.module.code)} · ${esc(l.module.title)}</div>`;
      lastModule = l.module.code;
    }
    lessonsHtml += `<label class="ligne ${l.code === rp.resume_lesson_code ? 'prevue' : ''}">
      <input type="checkbox" data-lecon="${esc(l.code)}" ${form.lessons.has(l.code) ? 'checked' : ''}>
      <span class="num">${esc(l.code)}</span><span class="txt">${esc(l.title)}</span></label>`;
  }

  const present = parseInt(form.present_count) || 0;
  const order = tr.lessons.map((l) => l.code);
  const objRows = [...form.lessons]
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .flatMap((code) => (lessonByCode(code)?.objectives || []).map((o) => `
      <div class="obj">
        <span class="txt"><span class="ref">${esc(o.code)}</span>${esc(o.text)}</span>
        <input type="number" min="0" max="${present || 99}" inputmode="numeric"
               data-obj="${esc(o.code)}" value="${form.objectives[o.code] ?? ''}"
               aria-label="Apprenants ayant démontré ${esc(o.code)}">
        <span class="sur">sur ${present || '—'}</span>
      </div>`)).join('');

  $('form').innerHTML = `
    <div class="position">
      <p class="etiq">${rp.fresh
        ? 'Aucune séance enregistrée. Cette filière démarre à :'
        : `La cohorte ${esc(form.cohort_code)} s'est arrêtée à :`}</p>
      <p class="lecon"><span class="num">${esc(lec.code)}</span>${esc(lec.title)}</p>
      <p class="mod">${esc(tr.name)} · ${esc(lec.module.code)} ${esc(lec.module.title)}</p>
      <p class="meta">${rp.fresh
        ? 'La première saisie fixera le point de départ.'
        : `Dernière séance le ${esc(rp.last_session_date || '—')}${
            rp.last_instructor ? ` · ${esc(rp.last_instructor)}` : ''}`}</p>
    </div>

    <div class="rangee champ">
      <div>
        <label for="fCohorte">Cohorte</label>
        <select id="fCohorte">${boot.cohorts.map((c) =>
          `<option value="${esc(c.code)}" ${c.code === form.cohort_code ? 'selected' : ''}
            >${esc(c.code)} · ${esc(c.site)}</option>`).join('')}</select>
      </div>
      <div>
        <label for="fDate">Date</label>
        <input type="date" id="fDate" value="${esc(form.session_date)}">
      </div>
    </div>

    <div class="champ">
      <label for="fPresents">Apprenants présents</label>
      <input type="number" id="fPresents" min="0" max="${co.enrolled_count}"
             inputmode="numeric" value="${esc(form.present_count)}"
             placeholder="sur ${co.enrolled_count} inscrits">
    </div>

    <div class="champ">
      <span class="legende">Leçons réellement traitées</span>
      <p class="aide">Cochez ce qui a été fait, pas ce qui était prévu.</p>
      <div class="lecons">${lessonsHtml}</div>
    </div>

    <div class="champ">
      <label for="fArret">Point d'arrêt — où reprendre</label>
      <p class="aide">Ce champ permet à un remplaçant de reprendre exactement ici.</p>
      <select id="fArret">${tr.lessons.map((l) =>
        `<option value="${esc(l.code)}" ${l.code === form.resume ? 'selected' : ''}
          >${esc(l.code)} — ${esc(l.title)}</option>`).join('')}</select>
    </div>

    <div class="champ">
      <span class="legende">Méthodes employées</span>
      <div class="puces">${boot.methods.map((m) =>
        `<button type="button" class="puce" data-methode="${esc(m.code)}"
           aria-pressed="${form.methods.has(m.code)}">${esc(m.name)}</button>`).join('')}</div>
    </div>

    ${form.methods.size ? `<div class="champ">
      <label for="fDominante">Méthode dominante</label>
      <select id="fDominante">${[...form.methods].map((c) => {
        const m = boot.methods.find((x) => x.code === c);
        return `<option value="${esc(c)}" ${c === form.dominant ? 'selected' : ''}>${esc(m?.name)}</option>`;
      }).join('')}</select></div>` : ''}

    <div class="champ">
      <span class="legende">Objectifs démontrés</span>
      <p class="aide">Nombre d'apprenants ayant réussi le contrôle.</p>
      ${objRows || '<p class="vide">Cochez une leçon pour faire apparaître ses objectifs.</p>'}
    </div>

    <div class="champ">
      <label for="fMotif">Ce qui a perturbé la séance</label>
      <select id="fMotif"><option value="">Rien à signaler</option>${boot.disruptions.map((d) =>
        `<option value="${esc(d.code)}" ${d.code === form.disruption ? 'selected' : ''}
          >${esc(d.label)}</option>`).join('')}</select>
    </div>

    <div class="champ">
      <label for="fNote">Difficulté ou point à signaler</label>
      <textarea id="fNote" maxlength="240" placeholder="Facultatif.">${esc(form.flag_note)}</textarea>
    </div>

    <div class="actions">
      <button class="primaire" id="btnSave">Enregistrer la séance</button>
      <div class="chrono" id="chrono"></div>
    </div>`;

  wire();
  renderQueue();
}

function wire() {
  $('fCohorte').onchange = (e) => {
    form.cohort_code = e.target.value;
    form.lessons = new Set(); form.objectives = {};
    form.resume = null;
    saveDraft(); render();
  };
  $('fDate').onchange = (e) => { form.session_date = e.target.value; saveDraft(); };
  $('fPresents').oninput = (e) => { form.present_count = e.target.value; saveDraft(); render(); };
  $('fArret').onchange = (e) => { form.resume = e.target.value; saveDraft(); };
  $('fMotif').onchange = (e) => { form.disruption = e.target.value; saveDraft(); };
  $('fNote').oninput = (e) => { form.flag_note = e.target.value; saveDraft(); };
  if ($('fDominante')) $('fDominante').onchange = (e) => { form.dominant = e.target.value; saveDraft(); };

  document.querySelectorAll('[data-lecon]').forEach((cb) => {
    cb.onchange = (e) => {
      const code = e.target.dataset.lecon;
      if (e.target.checked) { form.lessons.add(code); form.resume = nextLesson(code); }
      else form.lessons.delete(code);
      saveDraft(); render();
    };
  });

  document.querySelectorAll('[data-methode]').forEach((b) => {
    b.onclick = () => {
      const c = b.dataset.methode;
      if (form.methods.has(c)) {
        form.methods.delete(c);
        if (form.dominant === c) form.dominant = [...form.methods][0] || '';
      } else {
        form.methods.add(c);
        if (!form.dominant) form.dominant = c;
      }
      saveDraft(); render();
    };
  });

  document.querySelectorAll('[data-obj]').forEach((inp) => {
    inp.oninput = (e) => {
      const v = e.target.value;
      if (v === '') delete form.objectives[e.target.dataset.obj];
      else form.objectives[e.target.dataset.obj] = parseInt(v);
      saveDraft();
    };
  });

  $('btnSave').onclick = saveEntry;
}

/* draft is written on every change, debounced — a dead battery mid-entry
   must not cost an instructor the form at the end of a long day */
function saveDraft() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    Store.setDraft({
      ...form,
      lessons: [...form.lessons],
      methods: [...form.methods],
    }).catch(() => {});
  }, 300);
}

function tickTimer() {
  const el = $('chrono');
  if (!el || !started) return;
  const s = Math.floor((Date.now() - started) / 1000);
  el.textContent = `Saisie en cours : ${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
}

/* ================= saving ================= */

async function saveEntry() {
  if (!form.lessons.size) return toast('Cochez au moins une leçon traitée.');
  if (form.present_count === '') return toast('Indiquez le nombre de présents.');
  if (!form.methods.size) return toast('Sélectionnez au moins une méthode.');

  const payload = {
    id: newId(),
    cohort_code: form.cohort_code,
    session_date: form.session_date,
    device_created_at: new Date().toISOString(),
    present_count: parseInt(form.present_count),
    lessons_covered: [...form.lessons],
    resume_lesson: form.resume,
    methods: [...form.methods],
    dominant_method: form.dominant || null,
    objectives: Object.entries(form.objectives)
      .filter(([, v]) => Number.isInteger(v))
      .map(([code, demonstrated]) => ({ code, demonstrated })),
    disruption: form.disruption || null,
    flag_note: form.flag_note || null,
    app_version: '1.0.0',
  };

  // On the device first. Always. The network is not consulted before the
  // instructor is told this is saved, because on a bad connection that
  // wait is exactly how entries get lost.
  await Store.queueAdd({
    id: payload.id,
    payload,
    status: 'pending',
    queued_at: new Date().toISOString(),
  });

  // Advance the local resume point so tomorrow's entry is right even if
  // this phone does not see a network for a week.
  await Store.setPosition(form.cohort_code, form.resume, form.session_date);
  positions = await Store.getPositions();

  const seconds = Math.floor((Date.now() - started) / 1000);
  await Store.clearDraft();
  form.lessons = new Set(); form.methods = new Set();
  form.objectives = {}; form.dominant = ''; form.disruption = '';
  form.flag_note = ''; form.present_count = ''; form.resume = null;
  started = Date.now();

  render();
  toast(`Séance enregistrée sur l'appareil en ${Math.floor(seconds / 60)} min ${seconds % 60} s.`);

  sync();   // not awaited — the entry is already safe
}

/* ================= queue and status ================= */

async function renderQueue() {
  const items = await Store.queueAll();
  const el = $('queue');
  if (!items.length) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  el.innerHTML = `<h2>En attente d'envoi</h2>` + items.map((e) => {
    const p = e.payload;
    const bad = e.status === 'rejected';
    return `<div class="qitem">
      <span class="st ${bad ? 'bad' : 'wait'}">${bad ? 'refusée' : 'en attente'}</span>
      <span>
        ${esc(p.cohort_code)} · ${esc(p.session_date)} · ${esc(p.lessons_covered.join(', '))}
        ${bad ? `<div class="why">${esc((e.problems || []).join(' '))}</div>` : ''}
      </span></div>`;
  }).join('');
}

function paintBar(state) {
  const bar = $('bar'); const text = $('barText');
  if (!bar) return;
  Store.queueCount().then((pending) => {
    bar.className = '';
    if (state.state === 'offline' || !navigator.onLine) {
      bar.className = 'offline';
      text.textContent = pending
        ? `Hors ligne · ${pending} séance${pending > 1 ? 's' : ''} en attente`
        : 'Hors ligne · vos saisies seront envoyées au retour du réseau';
    } else if (state.state === 'signed-out') {
      bar.className = 'problem';
      text.textContent = 'Reconnexion nécessaire · rien n\'est perdu';
    } else if (pending) {
      bar.className = 'pending';
      text.textContent = `${pending} séance${pending > 1 ? 's' : ''} en cours d'envoi`;
    } else {
      text.textContent = 'Toutes les séances sont enregistrées';
    }
    renderQueue();
  });
}

let toastTimer = null;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('vu');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('vu'), 3600);
}

start().catch((err) => {
  console.error('Startup failed:', err);
  fatal('Une erreur est survenue au démarrage.', err && err.message);
});
