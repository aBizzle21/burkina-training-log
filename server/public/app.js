/*
 * The instructor app.
 *
 * Reads from the device, writes to the device, and lets sync.js worry
 * about the server. Nothing here waits on a network call before telling
 * an instructor their entry is saved, because on a bad connection that
 * wait is how entries get lost.
 */

import { Store, newId } from './store.js';
import { sync, onSyncChange, startSyncLoop } from './sync.js';
import { t, pick, setLang, getLang, LANGUAGES } from './i18n.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let boot = null;        // cached curriculum + cohorts, in both languages
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

/* ================= language ================= */

/**
 * Two buttons, not a switch. Someone who reads only one of the two
 * languages should be able to see their own written out and press it,
 * rather than work out which way a toggle is currently pointing.
 */
function languageButtons(size) {
  return `<div class="langpick ${size === 'small' ? 'small' : ''}">
    ${LANGUAGES.map((l) => `
      <button type="button" class="lang" data-lang="${l.code}"
              aria-pressed="${getLang() === l.code}"
              lang="${l.code}">${esc(l.label)}</button>`).join('')}
  </div>`;
}

function wireLanguage(after) {
  document.querySelectorAll('[data-lang]').forEach((b) => {
    b.onclick = async () => {
      if (b.dataset.lang === getLang()) return;
      setLang(b.dataset.lang);
      await Store.setLang(getLang());
      // No refetch. The curriculum is already held in both languages, so
      // this works with no connection.
      after();
    };
  });
}

/* ================= startup ================= */

function fatal(message, detail) {
  $('login').classList.add('hidden');
  $('app').classList.remove('hidden');
  $('form').innerHTML = `
    <div class="position" style="border-color:var(--tampon)">
      <p class="etiq">${esc(t('fatal_heading'))}</p>
      <p class="lecon" style="font-size:16px">${esc(message)}</p>
      ${detail ? `<p class="mod" style="word-break:break-word">${esc(detail)}</p>` : ''}
      <p class="meta">${esc(t('fatal_safe'))}</p>
    </div>
    <div class="actions">
      <button class="primaire" id="btnRetry">${esc(t('retry'))}</button>
      <button class="primaire" id="btnReset"
              style="background:var(--tampon);margin-top:10px">
        ${esc(t('sign_in_again'))}
      </button>
    </div>`;
  $('btnRetry').onclick = () => location.reload();
  $('btnReset').onclick = async () => {
    // Clears the sign-in only. The queue of unsent sessions is deliberately
    // left alone — it must never be thrown away to fix a display problem.
    await Store.clearAuth();
    await Store.clearDraft();
    location.reload();
  };
}

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled:', e.reason);
});

async function start() {
  // Language first, so everything shown from here on is in the right one.
  // A saved choice wins. With no choice yet, follow the phone's own
  // language if it is English, and otherwise default to French — the
  // programme is delivered in French, so that is the safer guess.
  const saved = await Store.getLang();
  if (saved) {
    setLang(saved);
  } else {
    const deviceIsEnglish = (navigator.language || '').toLowerCase().startsWith('en');
    setLang(deviceIsEnglish ? 'en' : 'fr');
  }

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

  if (!boot) {
    const ok = await fetchBootstrap();
    if (!ok) {
      showLogin(t('login_first_run'));
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
    const res = await fetch('/api/bootstrap', {
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

function showLogin(message) {
  $('app').classList.add('hidden');
  $('login').classList.remove('hidden');
  $('login').innerHTML = `
    <h1>${esc(t('app_title'))}</h1>
    <p>${esc(t('login_intro'))}</p>
    <input id="code" type="text" inputmode="text" autocomplete="off"
           autocapitalize="characters" placeholder="${esc(t('login_placeholder'))}"
           aria-label="${esc(t('login_aria'))}">
    <div class="err" id="loginErr" role="alert">${message ? esc(message) : ''}</div>
    <button class="primaire" id="loginBtn" style="margin-top:6px">${esc(t('login_button'))}</button>
    ${languageButtons()}`;

  $('loginBtn').onclick = doLogin;
  $('code').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
  wireLanguage(() => showLogin(message));
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
      $('loginErr').textContent = t('login_bad_code');
      return;
    }
    auth = await res.json();
    await Store.setAuth(auth);
    await fetchBootstrap();
    location.reload();
  } catch {
    $('loginErr').textContent = t('login_offline');
  } finally {
    const btn = $('loginBtn');
    if (btn) btn.disabled = false;
  }
}

/* ================= main screen ================= */

async function showApp() {
  $('login').classList.add('hidden');
  $('app').classList.remove('hidden');

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
const track = () => boot.tracks.find((t2) => t2.code === cohort()?.track_code);
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
  $('heading').textContent = t('heading');
  $('who').textContent = auth.instructor.name;
  document.title = t('app_title');

  const co = cohort();
  const tr = track();
  if (!co || !tr) {
    $('form').innerHTML = `<p class="vide">${esc(t('no_cohorts'))}</p>`;
    return;
  }

  const rp = resumePoint();
  const lec = lessonByCode(rp.resume_lesson_code) || tr.lessons[0];
  if (!form.resume) form.resume = rp.resume_lesson_code;

  let lessonsHtml = '';
  let lastModule = null;
  for (const l of tr.lessons) {
    if (l.module.code !== lastModule) {
      lessonsHtml += `<div class="modrow">${esc(l.module.code)} · ${esc(pick(l.module.title))}</div>`;
      lastModule = l.module.code;
    }
    const isNext = l.code === rp.resume_lesson_code;
    lessonsHtml += `<label class="ligne ${isNext ? 'prevue' : ''}">
      <input type="checkbox" data-lecon="${esc(l.code)}" ${form.lessons.has(l.code) ? 'checked' : ''}>
      <span class="num">${esc(l.code)}</span>
      <span class="txt">${esc(pick(l.title))}${
        isNext ? `<span class="tag">${esc(t('planned'))}</span>` : ''}</span></label>`;
  }

  const present = parseInt(form.present_count) || 0;
  const order = tr.lessons.map((l) => l.code);
  const objRows = [...form.lessons]
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .flatMap((code) => (lessonByCode(code)?.objectives || []).map((o) => `
      <div class="obj">
        <span class="txt"><span class="ref">${esc(o.code)}</span>${esc(pick(o.text))}</span>
        <input type="number" min="0" max="${present || 99}" inputmode="numeric"
               data-obj="${esc(o.code)}" value="${form.objectives[o.code] ?? ''}"
               aria-label="${esc(t('objectives_aria', o.code))}">
        <span class="sur">${esc(t('objectives_of', present))}</span>
      </div>`)).join('');

  $('form').innerHTML = `
    <div class="position" data-stamp="${esc(t('stamp'))}">
      <p class="etiq">${rp.fresh ? esc(t('resume_fresh')) : esc(t('resume_stopped', form.cohort_code))}</p>
      <p class="lecon"><span class="num">${esc(lec.code)}</span>${esc(pick(lec.title))}</p>
      <p class="mod">${esc(pick(tr.name))} · ${esc(lec.module.code)} ${esc(pick(lec.module.title))}</p>
      <p class="meta">${rp.fresh
        ? esc(t('resume_first_entry'))
        : esc(t('resume_last', rp.last_session_date || '—')) +
          (rp.last_instructor ? ` · ${esc(rp.last_instructor)}` : '')}</p>
    </div>

    <div class="rangee champ">
      <div>
        <label for="fCohorte">${esc(t('cohort'))}</label>
        <select id="fCohorte">${boot.cohorts.map((c) =>
          `<option value="${esc(c.code)}" ${c.code === form.cohort_code ? 'selected' : ''}
            >${esc(c.code)} · ${esc(c.site)}</option>`).join('')}</select>
      </div>
      <div>
        <label for="fDate">${esc(t('date'))}</label>
        <input type="date" id="fDate" value="${esc(form.session_date)}">
      </div>
    </div>

    <div class="champ">
      <label for="fPresents">${esc(t('present'))}</label>
      <input type="number" id="fPresents" min="0" max="${co.enrolled_count}"
             inputmode="numeric" value="${esc(form.present_count)}"
             placeholder="${esc(t('present_hint', co.enrolled_count))}">
    </div>

    <div class="champ">
      <span class="legende">${esc(t('lessons_label'))}</span>
      <p class="aide">${esc(t('lessons_hint'))}</p>
      <div class="lecons">${lessonsHtml}</div>
    </div>

    <div class="champ">
      <label for="fArret">${esc(t('resume_label'))}</label>
      <p class="aide">${esc(t('resume_hint'))}</p>
      <select id="fArret">${tr.lessons.map((l) =>
        `<option value="${esc(l.code)}" ${l.code === form.resume ? 'selected' : ''}
          >${esc(l.code)} — ${esc(pick(l.title))}</option>`).join('')}</select>
    </div>

    <div class="champ">
      <span class="legende">${esc(t('methods_label'))}</span>
      <div class="puces">${boot.methods.map((m) =>
        `<button type="button" class="puce" data-methode="${esc(m.code)}"
           aria-pressed="${form.methods.has(m.code)}">${esc(pick(m.name))}</button>`).join('')}</div>
    </div>

    ${form.methods.size ? `<div class="champ">
      <label for="fDominante">${esc(t('dominant_label'))}</label>
      <select id="fDominante">${[...form.methods].map((c) => {
        const m = boot.methods.find((x) => x.code === c);
        return `<option value="${esc(c)}" ${c === form.dominant ? 'selected' : ''}
          >${esc(pick(m?.name))}</option>`;
      }).join('')}</select></div>` : ''}

    <div class="champ">
      <span class="legende">${esc(t('objectives_label'))}</span>
      <p class="aide">${esc(t('objectives_hint'))}</p>
      ${objRows || `<p class="vide">${esc(t('objectives_empty'))}</p>`}
    </div>

    <div class="champ">
      <label for="fMotif">${esc(t('disruption_label'))}</label>
      <select id="fMotif"><option value="">${esc(t('disruption_none'))}</option>${
        boot.disruptions.map((d) =>
          `<option value="${esc(d.code)}" ${d.code === form.disruption ? 'selected' : ''}
            >${esc(pick(d.label))}</option>`).join('')}</select>
    </div>

    <div class="champ">
      <label for="fNote">${esc(t('note_label'))}</label>
      <textarea id="fNote" maxlength="240"
                placeholder="${esc(t('note_placeholder'))}">${esc(form.flag_note)}</textarea>
    </div>

    <div class="actions">
      <button class="primaire" id="btnSave">${esc(t('save'))}</button>
      <div class="chrono" id="chrono"></div>
    </div>

    <div class="langfoot">
      <span class="lbl">${esc(t('language_label'))}</span>
      ${languageButtons('small')}
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
  wireLanguage(() => { render(); paintBar({ state: navigator.onLine ? 'idle' : 'offline' }); });
}

/* The draft is written on every change, debounced — a dead battery
   mid-entry must not cost an instructor the form at the end of a long day */
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
  el.textContent = t('timer', Math.floor(s / 60), s % 60);
}

/* ================= saving ================= */

async function saveEntry() {
  if (!form.lessons.size) return toast(t('need_lesson'));
  if (form.present_count === '') return toast(t('need_present'));
  if (!form.methods.size) return toast(t('need_method'));

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
    app_version: '1.1.0',
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
  toast(t('saved', Math.floor(seconds / 60), seconds % 60));

  sync();   // not awaited — the entry is already safe
}

/* ================= queue and status ================= */

async function renderQueue() {
  const items = await Store.queueAll();
  const el = $('queue');
  if (!items.length) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  el.innerHTML = `<h2>${esc(t('queue_heading'))}</h2>` + items.map((e) => {
    const p = e.payload;
    const bad = e.status === 'rejected';
    return `<div class="qitem">
      <span class="st ${bad ? 'bad' : 'wait'}">${esc(bad ? t('queue_rejected') : t('queue_waiting'))}</span>
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
      text.textContent = pending ? t('bar_offline_pending', pending) : t('bar_offline_empty');
    } else if (state.state === 'signed-out') {
      bar.className = 'problem';
      text.textContent = t('bar_signed_out');
    } else if (pending) {
      bar.className = 'pending';
      text.textContent = t('bar_sending', pending);
    } else {
      text.textContent = t('bar_all_saved');
    }
    renderQueue();
  });
}

let toastTimer = null;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg; el.classList.add('vu');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('vu'), 3600);
}

start().catch((err) => {
  console.error('Startup failed:', err);
  fatal(t('fatal_generic'), err && err.message);
});
