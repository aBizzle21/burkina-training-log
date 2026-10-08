/*
 * Builds a single self-contained French page for review — no server, no
 * sign-in, no network. Open it by double-clicking and it works.
 *
 * Why it is generated rather than written by hand: the point of the page
 * is to let a native French speaker judge the wording that instructors
 * will actually see. A hand-written mock-up would drift from the real
 * thing within a week, and the reviewer would correct French that is not
 * in the product. So this takes the real interface strings, the real form
 * code and the real curriculum, and only replaces the two things that
 * need a server: the sign-in and the data fetch.
 *
 * Two constraints shaped the build:
 *   - ES modules are blocked on file:// , so the app's modules are
 *     flattened into one classic script. Their top-level names do not
 *     collide; the build fails loudly if that ever changes.
 *   - IndexedDB is unavailable on an opaque file:// origin in some
 *     browsers, so device storage is swapped for an in-memory stand-in
 *     with the same method names. Nothing is saved, which is correct for
 *     a review copy — a reviewer should never wonder whether they have
 *     just filed a real session.
 *
 *   node tools/build-review-page.js
 */

const fs = require('fs');
const path = require('path');
const C = require('../curriculum');

const PUB = path.join(__dirname, '..', 'server', 'public');
const read = (f) => fs.readFileSync(path.join(PUB, f), 'utf8');

/* ---------- 1. the data the app would have fetched ---------- */

const all = [];
for (const track of C.TRACKS) {
  for (const mod of track.modules) {
    for (const lesson of mod.lessons) {
      all.push({ ...lesson, module: mod, track });
    }
  }
}

const inPath = (lesson, level, pace) => C.inPathway(lesson, level, pace);

/** The lessons one cohort is taught, in teaching order. */
function pathwayFor(branch, level, pace) {
  return all
    .filter((l) => (l.track.kind === 'foundation' || l.track.code === branch) && inPath(l, level, pace))
    .sort((a, b) =>
      (a.track.kind === 'branch') - (b.track.kind === 'branch') ||
      a.module.position - b.module.position ||
      a.position - b.position);
}

const both = (v) => (v && typeof v === 'object' ? v : { en: v, fr: v });

function cohortPayload({ code, site, branch, level, pace, enrolled, resumeIndex }) {
  const lessons = pathwayFor(branch, level, pace);
  const track = C.TRACKS.find((t) => t.code === branch);
  return {
    id: code,
    code,
    site,
    track_code: branch,
    track_name: both(track.name),
    entry_level: level,
    pace,
    mixed_upper_level: null,
    enrolled_count: enrolled,
    status: 'active',
    position: {
      cohort_code: code,
      resume_lesson_code: lessons[resumeIndex] ? lessons[resumeIndex].code : null,
      last_session_date: null,
      last_instructor: null,
      days_since_last_session: 1,
      lessons_covered: resumeIndex,
      total_lessons: lessons.length,
    },
    lessons: lessons.map((l) => ({
      code: l.code,
      title: both(l.title),
      level: l.level,
      tier: l.tier,
      hours: l.hours ?? null,
      module: { code: l.module.code, title: both(l.module.title) },
      track: { code: l.track.code, kind: l.track.kind },
      objectives: (l.objectives || []).map((o) => ({ code: o.code, text: both(o.text) })),
    })),
  };
}

const bootstrap = {
  languages: ['fr', 'en'],
  tracks: C.TRACKS.filter((t) => t.kind === 'branch').map((t) => ({
    code: t.code, kind: t.kind, name: both(t.name), color: t.color || null,
  })),
  cohorts: [
    cohortPayload({ code: 'BF-01', site: 'Ouagadougou', branch: 'DEV', level: 'L0', pace: 'standard', enrolled: 14, resumeIndex: 9 }),
    cohortPayload({ code: 'BF-02', site: 'Bobo-Dioulasso', branch: 'SEC', level: 'L1', pace: 'steady', enrolled: 11, resumeIndex: 5 }),
    cohortPayload({ code: 'BF-03', site: 'Koudougou', branch: 'OPS', level: 'L2', pace: 'fast', enrolled: 9, resumeIndex: 8 }),
  ],
  instructors: [{ id: 'demo', name: 'Aminata Ouédraogo' }],
  methods: (C.METHODS || [
    { code: 'expose', name: { fr: 'Exposé magistral', en: 'Lecture' } },
    { code: 'demo', name: { fr: 'Démonstration', en: 'Demonstration' } },
    { code: 'guidee', name: { fr: 'Pratique guidée', en: 'Guided practice' } },
    { code: 'autonome', name: { fr: 'Travail autonome', en: 'Independent work' } },
    { code: 'groupe', name: { fr: 'Travail de groupe', en: 'Group work' } },
    { code: 'evaluation', name: { fr: 'Évaluation', en: 'Assessment' } },
  ]).map((m) => ({ code: m.code, name: both(m.name), color: m.color || null })),
  disruptions: (C.DISRUPTIONS || [
    { code: 'electricite', label: { fr: 'Coupure d’électricité', en: 'Power cut' } },
    { code: 'reseau', label: { fr: 'Panne de réseau', en: 'Network outage' } },
    { code: 'materiel', label: { fr: 'Matériel indisponible', en: 'Equipment unavailable' } },
    { code: 'absence', label: { fr: 'Absentéisme important', en: 'High absence' } },
    { code: 'securite', label: { fr: 'Situation sécuritaire', en: 'Security situation' } },
    { code: 'salle', label: { fr: 'Salle indisponible', en: 'Room unavailable' } },
  ]).map((d) => ({ code: d.code, label: both(d.label) })),
};

/* ---------- 2. flatten the app's modules ---------- */

const stripModule = (src) =>
  src
    .replace(/^\s*import\s+[^;]+;\s*$/gm, '')
    .replace(/^export\s+/gm, '');

// A review page that silently shared a name between two modules would
// behave differently from the product, which defeats the purpose.
function assertNoCollisions(files) {
  const seen = new Map();
  for (const [name, src] of files) {
    const decls = [...src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm)]
      .map((m) => m[1]);
    for (const d of decls) {
      if (seen.has(d)) {
        throw new Error(
          `Name "${d}" is declared in both ${seen.get(d)} and ${name}. ` +
          'Flattening them into one script would break the review page.');
      }
      seen.set(d, name);
    }
  }
}

/** Device storage, in memory. Same surface as the real Store. */
const STORE_SHIM = `
/* Device storage, replaced for the review copy.
   The real app keeps entries in IndexedDB so they survive with no signal.
   Here nothing is saved: this page is for reading the French, and a
   reviewer should never be left wondering whether they just filed a
   real session. */
const MEM = {
  lang: 'fr',
  // Already signed in. The reviewer was asked to read French, not to
  // be handed a code first, and a sign-in screen is the one part of
  // the app that has nothing to do with the wording of the rest.
  auth: { token: 'review', instructor: { id: 'demo', name: 'Aminata Ou\u00e9draogo' } },
  bootstrap: null, draft: null, queue: [], positions: {}, lastSync: null,
};
const Store = {
  getLang: async () => MEM.lang,
  setLang: async (v) => { MEM.lang = v; },
  getAuth: async () => MEM.auth,
  setAuth: async (v) => { MEM.auth = v; },
  clearAuth: async () => { MEM.auth = null; },
  getBootstrap: async () => MEM.bootstrap,
  setBootstrap: async (v) => { MEM.bootstrap = v; },
  getDraft: async () => MEM.draft,
  setDraft: async (v) => { MEM.draft = v; },
  clearDraft: async () => { MEM.draft = null; },
  queueAdd: async (e) => { MEM.queue = MEM.queue.filter((q) => q.id !== e.id).concat(e); },
  queueAll: async () => MEM.queue.slice(),
  queueRemove: async (id) => { MEM.queue = MEM.queue.filter((q) => q.id !== id); },
  queueCount: async () => MEM.queue.filter((e) => e.status !== 'rejected').length,
  getPositions: async () => MEM.positions,
  setPosition: async (code, p) => { MEM.positions[code] = p; },
  mergePositions: async (p) => { Object.assign(MEM.positions, p); },
  getLastSync: async () => MEM.lastSync,
  setLastSync: async (w) => { MEM.lastSync = w; },
};
function newId() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
}
`;

/** Sending, replaced. Everything stays on the page. */
const SYNC_SHIM = `
/* Sending to the server, replaced for the review copy. Saved entries stay
   in the list on screen, which is what an instructor with no signal would
   also see. */
const listeners = [];
function onSyncChange(fn) { listeners.push(fn); }
function announce(s) { listeners.forEach((f) => f(s)); }
async function sync() { announce({ state: 'offline', pending: await Store.queueCount() }); return { offline: true }; }
async function authHeaders() { return {}; }
async function refreshPositions() {}
function startSyncLoop() {}
`;

/** The two calls that need a server. */
const FETCH_SHIM = `
/* The only two things the app asks a server for: who is signing in, and
   the curriculum. Both are answered from this file. Any code is accepted,
   because there is nothing here worth protecting. */
const BOOTSTRAP = ${JSON.stringify(bootstrap)};
const REAL_FETCH = window.fetch ? window.fetch.bind(window) : null;
window.fetch = async (url, opts) => {
  const u = String(url);
  const ok = (body) => new Response(JSON.stringify(body), {
    status: 200, headers: { 'Content-Type': 'application/json' } });
  if (u.includes('/api/bootstrap')) return ok(BOOTSTRAP);
  if (u.includes('/api/login')) {
    return ok({ token: 'review', instructor: { id: 'demo', name: 'Aminata Ou\\u00e9draogo' } });
  }
  if (REAL_FETCH) return REAL_FETCH(url, opts);
  return new Response('{}', { status: 200 });
};
/* A service worker cannot be registered from a local file. The app tests
   for the property and then calls register(), so removing it is not enough
   — it needs something harmless to call. */
Object.defineProperty(navigator, 'serviceWorker', {
  value: { register: () => Promise.resolve(), ready: new Promise(() => {}) },
  configurable: true,
});
`;

const i18n = read('i18n.js');
const app = read('app.js');
assertNoCollisions([['i18n.js', i18n], ['app.js', app]]);

const script = [
  STORE_SHIM,
  SYNC_SHIM,
  FETCH_SHIM,
  stripModule(i18n),
  stripModule(app),
].join('\n');

/* ---------- 3. the curriculum, for review ---------- */

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const LEVEL_FR = Object.fromEntries(C.LEVELS.map((l) => [l.code, l.name.fr]));
const TIER_FR = Object.fromEntries((C.TIERS || []).map((t) => [t.code, (t.name && t.name.fr) || t.code]));

let curriculumHtml = '';
let lessonCount = 0;
for (const track of C.TRACKS) {
  // The foundation's own name already says what it is; repeating it as a
  // label beside the name read as a stutter.
  const kind = track.kind === 'foundation' ? '' : 'Filière';
  curriculumHtml += `<section class="piste"><h2>${esc(track.name.fr)}${
    kind ? ` <span class="genre">${kind}</span>` : ''}</h2>`;
  if (track.blurb && track.blurb.fr) curriculumHtml += `<p class="chapeau">${esc(track.blurb.fr)}</p>`;
  for (const mod of track.modules) {
    curriculumHtml += `<div class="module"><h3>${esc(mod.code)} · ${esc(mod.title.fr)}</h3>`;
    if (mod.note && mod.note.fr) curriculumHtml += `<p class="note">${esc(mod.note.fr)}</p>`;
    for (const l of mod.lessons) {
      lessonCount++;
      const objs = (l.objectives || []).map((o) =>
        `<li>${esc(o.text.fr)}</li>`).join('');
      curriculumHtml += `
        <article class="fiche" data-code="${esc(l.code)}">
          <div class="entete">
            <span class="code">${esc(l.code)}</span>
            <span class="titre">${esc(l.title.fr)}</span>
            <span class="tags">${esc(LEVEL_FR[l.level] || l.level)}${
              TIER_FR[l.tier] ? ' · ' + esc(TIER_FR[l.tier]) : ''}${
              l.hours ? ' · ' + l.hours + ' h' : ''}</span>
          </div>
          ${objs ? `<ul class="objectifs">${objs}</ul>` : ''}
          <button class="signaler" data-for="${esc(l.code)}">Signaler une correction</button>
          <div class="correction cachee">
            <textarea rows="2" placeholder="Ce qui ne va pas, et la formulation correcte…"></textarea>
          </div>
        </article>`;
    }
    curriculumHtml += '</div>';
  }
  curriculumHtml += '</section>';
}

/* ---------- 4. assemble ---------- */

const source = read('index.html');
const head = source.slice(source.indexOf('<style>'), source.indexOf('</style>') + 8);
const bodyStart = source.indexOf('<body>') + 6;
const bodyEnd = source.indexOf('<script');
const appBody = source.slice(bodyStart, bodyEnd);

const page = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Journal de formation — version de relecture</title>
${head}
<style>
/* ---- the review wrapper, around the real app ---- */
body.revue{background:#E9EAE3}
.bandeau{background:#16233A;color:#fff;padding:14px 20px}
.bandeau .wrap2{max-width:860px;margin:0 auto}
.bandeau h1{font-family:"Zilla Slab",Georgia,serif;font-size:19px;margin:0 0 3px}
.bandeau p{margin:0;font-size:13px;opacity:.85;max-width:70ch}
.onglets{background:#fff;border-bottom:1px solid #C9CDBF;position:sticky;top:0;z-index:40}
.onglets .wrap2{max-width:860px;margin:0 auto;display:flex;gap:4px;padding:0 20px}
.onglets button{background:none;border:none;border-bottom:3px solid transparent;
  font:600 14px/1.25 "Archivo",system-ui,sans-serif;color:#616A5C;padding:12px 14px;cursor:pointer}
.onglets button[aria-selected="true"]{color:#16233A;border-bottom-color:#16233A}
.vue{display:none}
.vue.active{display:block}
.revue-wrap{max-width:860px;margin:0 auto;padding:22px 20px 80px}

#vueProgramme .piste{margin-bottom:34px}
#vueProgramme .piste h2{font-family:"Zilla Slab",Georgia,serif;font-size:21px;margin:0 0 4px;
  padding-bottom:7px;border-bottom:2px solid #16233A}
#vueProgramme .piste .genre{font-family:"Archivo",sans-serif;font-size:11px;font-weight:700;color:#616A5C;
  text-transform:uppercase;letter-spacing:.07em;margin-left:8px;vertical-align:2px}
#vueProgramme .piste .chapeau{font-size:13.5px;color:#616A5C;margin:8px 0 16px;max-width:66ch}
#vueProgramme .module{margin:18px 0 24px}
#vueProgramme .module h3{font-size:15px;margin:0 0 3px;color:#16233A}
#vueProgramme .module .note{font-size:13px;color:#616A5C;margin:0 0 10px;max-width:66ch}
#vueProgramme .fiche{background:#FAFAF6;border:1px solid #C9CDBF;border-radius:3px;padding:12px 14px;margin-bottom:8px}
#vueProgramme .fiche .entete{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
#vueProgramme .fiche .code{font-weight:700;font-size:12.5px;color:#2E5E4E;flex:none}
#vueProgramme .fiche .titre{font-weight:600;font-size:14.5px;flex:1;min-width:200px}
#vueProgramme .fiche .tags{font-size:11.5px;color:#616A5C;flex:none}
#vueProgramme .fiche .objectifs{margin:8px 0 0;padding-left:20px;font-size:13.5px;color:#16233A}
#vueProgramme .fiche .objectifs li{margin-bottom:3px}
#vueProgramme .fiche .signaler{margin-top:9px;background:none;border:1px solid #C9CDBF;border-radius:3px;
  font:600 12.5px/1 "Archivo",sans-serif;color:#16233A;padding:0 12px;min-height:36px;cursor:pointer}
#vueProgramme .fiche .signaler:hover{border-color:#16233A}
#vueProgramme .fiche .signaler.actif{background:#16233A;color:#fff;border-color:#16233A}
#vueProgramme .correction{margin-top:8px}
#vueProgramme .correction.cachee{display:none}
#vueProgramme .correction textarea{width:100%;font:inherit;font-size:13.5px;padding:9px;
  border:1px solid #C9CDBF;border-radius:3px;background:#fff;resize:vertical}

.barre-notes{position:fixed;left:0;right:0;bottom:0;background:#16233A;color:#fff;
  padding:11px 20px;display:none;z-index:60}
.barre-notes.visible{display:block}
.barre-notes .wrap2{max-width:860px;margin:0 auto;display:flex;gap:12px;
  align-items:center;justify-content:space-between;flex-wrap:wrap}
.barre-notes span{font-size:13.5px}
.barre-notes button{background:#fff;color:#16233A;border:none;border-radius:3px;
  font:600 13px/1 "Archivo",sans-serif;padding:0 14px;min-height:40px;cursor:pointer}

#vueProgramme .avis{background:#FBF7EC;border:1px solid #C9CDBF;border-left:3px solid #8A6A1F;
  border-radius:3px;padding:12px 15px;margin-bottom:22px;font-size:13.5px;line-height:1.55}
#vueProgramme .avis b{display:block;margin-bottom:3px}
</style>
</head>
<body class="revue">

<div class="bandeau">
  <div class="wrap2">
    <h1>Journal de formation — version de relecture</h1>
    <p>Copie hors ligne, sans code d’accès et sans serveur. Rien n’est enregistré ni envoyé&nbsp;:
       cette page sert à relire le français de l’application et du programme.</p>
  </div>
</div>

<div class="onglets">
  <div class="wrap2">
    <button id="ongletJournal" aria-selected="true">Le journal quotidien</button>
    <button id="ongletProgramme" aria-selected="false">Le programme (${lessonCount} leçons)</button>
  </div>
</div>

<div class="vue active" id="vueJournal">${appBody}</div>

<div class="vue" id="vueProgramme">
  <div class="revue-wrap">
    <div class="avis">
      <b>Ce qu’il faut relire</b>
      Les intitulés de leçons et les objectifs ci-dessous sont ceux que les formateurs verront
      chaque jour. Le français a été rédigé hors du pays&nbsp;: les tournures maladroites, les termes
      techniques mal choisis et tout ce qui ne se dirait pas ainsi au Burkina Faso sont exactement
      ce que nous cherchons. Utilisez le bouton sous chaque leçon, puis le bouton
      «&nbsp;Copier toutes les remarques&nbsp;» en bas.
    </div>
    ${curriculumHtml}
  </div>
</div>

<div class="barre-notes" id="barreNotes">
  <div class="wrap2">
    <span id="compteNotes">0 remarque</span>
    <button id="copierNotes">Copier toutes les remarques</button>
  </div>
</div>

<script>
${script}
</script>

<script>
/* ---- the review wrapper's own behaviour ---- */
(function () {
  const vues = { journal: document.getElementById('vueJournal'),
                 programme: document.getElementById('vueProgramme') };
  const ongs = { journal: document.getElementById('ongletJournal'),
                 programme: document.getElementById('ongletProgramme') };
  function montrer(nom) {
    for (const k of Object.keys(vues)) {
      vues[k].classList.toggle('active', k === nom);
      ongs[k].setAttribute('aria-selected', String(k === nom));
    }
    window.scrollTo(0, 0);
  }
  ongs.journal.onclick = () => montrer('journal');
  ongs.programme.onclick = () => montrer('programme');

  /* corrections */
  document.querySelectorAll('.signaler').forEach((b) => {
    b.onclick = () => {
      const boite = b.nextElementSibling;
      const ouvert = !boite.classList.contains('cachee');
      boite.classList.toggle('cachee', ouvert);
      b.classList.toggle('actif', !ouvert);
      if (!ouvert) boite.querySelector('textarea').focus();
    };
  });

  const barre = document.getElementById('barreNotes');
  const compte = document.getElementById('compteNotes');
  function recompter() {
    const n = [...document.querySelectorAll('.correction textarea')]
      .filter((t) => t.value.trim()).length;
    compte.textContent = n + (n === 1 ? ' remarque' : ' remarques');
    barre.classList.toggle('visible', n > 0);
  }
  document.addEventListener('input', (e) => {
    if (e.target.matches('.correction textarea')) recompter();
  });

  document.getElementById('copierNotes').onclick = async () => {
    const lignes = [];
    document.querySelectorAll('.fiche').forEach((l) => {
      const t = l.querySelector('textarea');
      if (t && t.value.trim()) {
        lignes.push(l.dataset.code + ' — ' + l.querySelector('.titre').textContent);
        lignes.push('   ' + t.value.trim());
        lignes.push('');
      }
    });
    const texte = 'Relecture du programme — ' + new Date().toLocaleDateString('fr-FR') +
                  '\\n\\n' + lignes.join('\\n');
    try {
      await navigator.clipboard.writeText(texte);
      document.getElementById('copierNotes').textContent = 'Copié — collez dans un courriel';
    } catch {
      /* Clipboard access is refused on a local file in some browsers.
         Falling back to a download rather than losing the reviewer's work. */
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([texte], { type: 'text/plain' }));
      a.download = 'remarques-programme.txt';
      a.click();
    }
  };
})();
</script>
</body>
</html>`;

const out = path.join(__dirname, '..', 'docs', 'journal-relecture-fr.html');
fs.writeFileSync(out, page);
console.log('written', out);
console.log(lessonCount, 'lessons,',
  bootstrap.cohorts.length, 'demo cohorts,',
  Math.round(page.length / 1024), 'KB');
