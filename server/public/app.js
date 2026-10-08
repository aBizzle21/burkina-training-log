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
// The lesson ladder belongs to the COHORT, not the track. Two cohorts on
// the same branch entering at different levels are taught different
// lessons, and an instructor must only ever see their own cohort's.
const lessons = () => cohort()?.lessons || [];
const lessonByCode = (code) => lessons().find((l) => l.code === code);

function resumePoint() {
  const p = positions[form.cohort_code];
  if (p && p.resume_lesson_code) return p;
  // First lesson of THIS COHORT'S pathway. For a cohort entering at L3
  // that is not the first lesson of the foundation — it is somewhere well
  // inside the branch.
  const first = lessons()[0];
  return { resume_lesson_code: first?.code, last_session_date: null, fresh: true };
}

/** The next lesson in this cohort's pathway, skipping what it does not do. */
function nextLesson(code) {
  const list = lessons();
  const i = list.findIndex((l) => l.code === code);
  return i >= 0 && i < list.length - 1 ? list[i + 1].code : code;
}

/* Which sections are expanded.
 *
 * Kept outside the form because the form re-renders on almost every
 * keystroke, and a <details> element that folds itself shut whenever a
 * number changes is worse than no collapsing at all. Lessons start open
 * because that is the first thing anyone fills in.
 */
const openSections = new Set(['lecons', 'presence']);

/* Module groups the instructor has opened by hand, kept for the same
   reason as the sections above: the form re-renders constantly and a
   group that shuts itself mid-tick is worse than no grouping. */
const openModules = new Set();

/** One collapsible section: a header carrying a summary, and a body. */
function section(key, title, summary, bodyHtml, filled) {
  return `<details class="pli" data-sec="${esc(key)}" ${openSections.has(key) ? 'open' : ''}>
    <summary>
      <span class="tete">${esc(title)}</span>
      <span class="resume ${filled ? 'rempli' : ''}">${esc(summary)}</span>
    </summary>
    <div class="corps">${bodyHtml}</div>
  </details>`;
}

/**
 * The group picker.
 *
 * An instructor sees only the groups assigned to them, arranged country
 * then city then branch — the way the programme is organised, and the
 * way somebody standing in a room thinks. With one group it collapses to
 * a single line, because choosing from a list of one is just a tap.
 */
function groupPicker() {
  const list = boot.cohorts;
  if (!list.length) return `<p class="vide">${esc(t('no_group_assigned'))}</p>`;

  const chosen = cohort();
  if (chosen && (list.length === 1 || !form._picking)) {
    const place = [chosen.country && chosen.country.name ? pick(chosen.country.name) : null,
                   chosen.city, chosen.site].filter(Boolean).join(' \u203a ');
    return `<div class="groupe"><div class="choisi">
      <div>
        <div class="nom2">${esc(chosen.code)} · ${esc(pick(chosen.track_name))}</div>
        <div class="ou">${esc(place)}</div>
      </div>
      ${list.length > 1
        ? `<button type="button" id="btnChangeGroup">${esc(t('change_group'))}</button>`
        : ''}
    </div></div>`;
  }

  const byPlace = new Map();
  for (const c of list) {
    const place = [c.country && c.country.name ? pick(c.country.name) : null, c.city, c.site]
      .filter(Boolean).join(' \u203a ');
    if (!byPlace.has(place)) byPlace.set(place, []);
    byPlace.get(place).push(c);
  }

  let html = `<div class="groupe">
    <p class="quest">${esc(t('pick_group'))}</p>
    <p class="aide2">${esc(t('pick_group_hint'))}</p>`;
  for (const [place, group] of byPlace) {
    html += `<div class="lieu">${esc(place)}</div><div class="tuiles">` +
      group.map((c) => {
        const pos = positions[c.code] || {};
        return `<button type="button" class="tuile" data-groupe="${esc(c.code)}"
                  aria-pressed="${c.code === form.cohort_code}">
          <span class="t1">${esc(c.code)}</span>
          <span class="t2">${esc(pick(c.track_name))}</span>
          <span class="t3">${esc(pos.resume_lesson_code
            ? t('resume_stopped_short', pos.resume_lesson_code)
            : t('resume_fresh'))}</span>
        </button>`;
      }).join('') + '</div>';
  }
  return html + '</div>';
}


/**
 * A date an instructor can read.
 *
 * The server sends whatever Postgres gives it, which for a date column
 * arrives as a full ISO timestamp once it has been through JSON. Printed
 * raw it reads as a fault in the app, so it is cut back to the day and
 * shown in the language in use.
 */
function shortDate(value) {
  if (!value) return '\u2014';
  const d = new Date(String(value).slice(0, 10) + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString(getLang() === 'en' ? 'en-GB' : 'fr-FR',
    { day: 'numeric', month: 'long', year: 'numeric' });
}

function render() {
  $('heading').textContent = t('heading');
  $('who').textContent = auth.instructor.name;
  document.title = t('app_title');

  const co = cohort();
  const list = lessons();
  if (!co || !list.length) {
    $('form').innerHTML = `<p class="vide">${esc(t('no_cohorts'))}</p>`;
    return;
  }

  const rp = resumePoint();
  const lec = lessonByCode(rp.resume_lesson_code) || list[0];
  if (!form.resume) form.resume = rp.resume_lesson_code;

  // Lessons grouped by module, and only the module the cohort is at is
  // open. Flat, this is sixty-odd rows of things the instructor is not
  // going to tick today, with the one they are somewhere in the middle.
  // Keyed by track AND module code. Module codes only run M1..Mn inside
  // their own track, so the foundation's M3 and the course's M3 are two
  // different modules — keyed by code alone, opening one opens both.
  const keyOf = (l) => `${l.track.code}:${l.module.code}`;
  const byModule = [];
  for (const l of list) {
    const last = byModule[byModule.length - 1];
    if (last && last.key === keyOf(l)) last.lessons.push(l);
    else byModule.push({ key: keyOf(l), code: l.module.code, title: l.module.title,
                         track: l.track, lessons: [l] });
  }

  const hereModule = keyOf(lessonByCode(rp.resume_lesson_code) || list[0]);
  const shouldOpen = (g) =>
    form._allModules ||
    openModules.has(g.key) ||
    g.key === hereModule ||
    g.lessons.some((l) => form.lessons.has(l.code));

  let lessonsHtml = '';
  let lastTrack = null;
  for (const g of byModule) {
    // Module numbers restart inside each track, so without a line between
    // them the list reads M1..M9 then M1..M5 again and looks broken.
    if (g.track.code !== lastTrack) {
      lessonsHtml += `<div class="pistehdr">${esc(g.track.kind === 'foundation'
        ? t('part_foundation') : pick(co.track_name))}</div>`;
      lastTrack = g.track.code;
    }
    const ticked = g.lessons.filter((l) => form.lessons.has(l.code)).length;
    const here = g.key === hereModule;
    const note = ticked
      ? `<span class="ms faits">${esc(t('mod_ticked', ticked))}</span>`
      : here
        ? `<span class="ms ici">${esc(t('mod_here'))}</span>`
        : `<span class="ms">${esc(t('mod_lessons', g.lessons.length))}</span>`;

    // Outside this instructor's approval: marked, never hidden or blocked.
    // If they taught it, the log has to be able to say so — an unrecorded
    // session costs the programme more than an unapproved one.
    //
    // Approval is granted per module, so normally a whole module is in or
    // out, and the marker goes once on its header. Repeated on every lesson
    // it was eight identical badges, each pushing its title onto two lines
    // on a phone. The per-lesson marker remains for the case a module is
    // ever split.
    const outside = g.lessons.filter((l) => l.approved === false).length;
    const wholeModuleOutside = outside > 0 && outside === g.lessons.length;

    let rows = '';
    for (const l of g.lessons) {
      const isNext = l.code === rp.resume_lesson_code;
      const hors = l.approved === false;
      rows += `<label class="ligne ${isNext ? 'prevue' : ''} ${hors ? 'hors' : ''}">
        <input type="checkbox" data-lecon="${esc(l.code)}" ${form.lessons.has(l.code) ? 'checked' : ''}>
        <span class="num">${esc(l.code)}</span>
        <span class="txt">${esc(pick(l.title))}${
          isNext ? `<span class="tag">${esc(t('planned'))}</span>` : ''}${
          hors && !wholeModuleOutside ? `<span class="pastille-h">${esc(t('not_approved'))}</span>` : ''}</span></label>`;
    }

    lessonsHtml += `<details class="modgrp${wholeModuleOutside ? ' hors' : ''}" data-mod="${esc(g.key)}" ${shouldOpen(g) ? 'open' : ''}>
      <summary>
        <span class="mt"><span class="mc">${esc(g.code)}</span>${esc(pick(g.title))}${
          wholeModuleOutside ? `<span class="pastille-m">${esc(t('not_approved'))}</span>` : ''}</span>
        ${note}
      </summary>${rows}</details>`;
  }

  const present = parseInt(form.present_count) || 0;
  const order = list.map((l) => l.code);
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

  const anyHors = list.some((l) => l.approved === false && form.lessons.has(l.code));
  const nLes = form.lessons.size;
  const nMeth = form.methods.size;
  const nObj = Object.values(form.objectives).filter((v) => v !== '' && v != null).length;
  const totalObj = (objRows.match(/class="obj"/g) || []).length;
  const hasPresent = form.present_count !== '' && form.present_count != null;

  $('form').innerHTML = `
    ${groupPicker()}

    <div class="position" data-stamp="${esc(t('stamp'))}">
      <p class="etiq">${rp.fresh ? esc(t('resume_fresh')) : esc(t('resume_stopped', form.cohort_code))}</p>
      <p class="lecon"><span class="num">${esc(lec.code)}</span>${esc(pick(lec.title))}</p>
      <p class="mod">${esc(pick(co.track_name))} · ${esc(lec.module.code)} ${esc(pick(lec.module.title))}</p>
      <p class="meta">${rp.fresh
        ? esc(t('resume_first_entry'))
        : esc(t('resume_last', shortDate(rp.last_session_date))) +
          (rp.last_instructor ? ` · ${esc(rp.last_instructor)}` : '')}</p>
    </div>

    ${section('lecons', t('sec_lessons'),
      nLes ? t('sum_lessons', nLes) : t('sum_empty'), `
      <p class="aide">${esc(t('lessons_hint'))}</p>
      <div class="lecons">${lessonsHtml}</div>
      ${byModule.length > 1 ? `<button type="button" class="toutmods" id="btnAllMods">${
        esc(form._allModules ? t('show_fewer_modules') : t('show_all_modules'))}</button>` : ''}
      ${anyHors ? `<p class="hors-note">${esc(t('not_approved_hint'))}</p>` : ''}
      <div class="champ" style="margin-top:14px">
        <label for="fArret">${esc(t('resume_label'))}</label>
        <p class="aide">${esc(t('resume_hint'))}</p>
        <select id="fArret">${list.map((l) =>
          `<option value="${esc(l.code)}" ${l.code === form.resume ? 'selected' : ''}
            >${esc(l.code)} — ${esc(pick(l.title))}</option>`).join('')}</select>
      </div>`, nLes > 0)}

    ${section('presence', t('sec_attendance'),
      hasPresent ? t('sum_present', form.present_count, co.enrolled_count) : t('sum_empty'), `
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
      </div>`, hasPresent)}

    ${section('methodes', t('sec_methods'),
      nMeth ? t('sum_methods', nMeth) : t('sum_empty'), `
      <div class="puces">${boot.methods.map((m) =>
        `<button type="button" class="puce" data-methode="${esc(m.code)}"
           aria-pressed="${form.methods.has(m.code)}">${esc(pick(m.name))}</button>`).join('')}</div>
      ${form.methods.size ? `<div class="champ" style="margin-top:13px">
        <label for="fDominante">${esc(t('dominant_label'))}</label>
        <select id="fDominante">${[...form.methods].map((c) => {
          const m = boot.methods.find((x) => x.code === c);
          return `<option value="${esc(c)}" ${c === form.dominant ? 'selected' : ''}
            >${esc(pick(m?.name))}</option>`;
        }).join('')}</select></div>` : ''}`, nMeth > 0)}

    ${section('objectifs', t('sec_results'),
      totalObj ? `${nObj}/${totalObj}` : t('sum_empty'), `
      <p class="aide">${esc(t('objectives_hint'))}</p>
      ${objRows || `<p class="vide">${esc(t('objectives_empty'))}</p>`}`,
      totalObj > 0 && nObj === totalObj)}

    ${section('soucis', t('sec_issues'),
      (form.disruption || form.flag_note)
        ? (form.disruption
            ? pick((boot.disruptions.find((d) => d.code === form.disruption) || {}).label)
            : t('note_label'))
        : t('sum_empty'), `
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
      </div>`, Boolean(form.disruption || form.flag_note))}

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
  // Remember which sections are open, so a re-render does not fold the
  // form up under the person filling it in.
  document.querySelectorAll('.pli').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (d.open) openSections.add(d.dataset.sec);
      else openSections.delete(d.dataset.sec);
    });
  });

  document.querySelectorAll('.modgrp').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (d.open) openModules.add(d.dataset.mod);
      else openModules.delete(d.dataset.mod);
    });
  });
  if ($('btnAllMods')) {
    $('btnAllMods').onclick = () => {
      form._allModules = !form._allModules;
      if (!form._allModules) openModules.clear();
      render();
    };
  }

  document.querySelectorAll('[data-groupe]').forEach((b) => {
    b.onclick = () => {
      form.cohort_code = b.dataset.groupe;
      form.lessons = new Set(); form.objectives = {};
      form.resume = null; form._picking = false;
      saveDraft(); render();
    };
  });
  if ($('btnChangeGroup')) {
    $('btnChangeGroup').onclick = () => { form._picking = true; render(); };
  }

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
  // Open the section the complaint is about before complaining.
  //
  // Now that the form folds up, a message saying a method is required is
  // useless if the methods section is shut — the instructor is told to
  // fix something they cannot see. Each check names its own section, and
  // the section is opened and scrolled to.
  const complain = (sec, message) => {
    openSections.add(sec);
    const d = document.querySelector(`.pli[data-sec="${sec}"]`);
    if (d) {
      d.open = true;
      d.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    toast(message);
    return undefined;
  };

  if (!form.lessons.size) return complain('lecons', t('need_lesson'));
  if (form.present_count === '') return complain('presence', t('need_present'));
  if (!form.methods.size) return complain('methodes', t('need_method'));

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
    // A rejected entry is never retried, so without a way to clear it the
    // instructor is left with a card that stays on their screen for the
    // rest of the programme and no action that removes it. Dismissing is
    // deliberate and labelled rather than automatic: the entry is one they
    // believe they filed, and it disappearing by itself is how somebody
    // ends up blamed for not logging.
    return `<div class="qitem">
      <span class="st ${bad ? 'bad' : 'wait'}">${esc(bad ? t('queue_rejected') : t('queue_waiting'))}</span>
      <span>
        ${esc(p.cohort_code)} · ${esc(p.session_date)} · ${esc(p.lessons_covered.join(', '))}
        ${bad ? `<div class="why">${esc((e.problems || []).join(' '))}</div>
                 <button class="dismiss" data-drop="${esc(e.id)}">${esc(t('queue_dismiss'))}</button>` : ''}
      </span></div>`;
  }).join('');

  el.querySelectorAll('[data-drop]').forEach((b) => {
    b.onclick = async () => {
      b.disabled = true;
      await Store.queueRemove(b.dataset.drop);
      await renderQueue();
      paintBar({ state: 'idle' });
    };
  });
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
