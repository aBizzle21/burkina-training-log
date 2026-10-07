#!/usr/bin/env node
/*
 * Builds a self-contained page for exploring the curriculum.
 *
 *   node tools/build-pathway-browser.js
 *
 * Writes docs/pathways.html with the whole curriculum embedded, so it
 * opens from a file with no server and no connection — which is the point,
 * since it will be reviewed by people who are not going to run anything.
 */

const fs = require('fs');
const path = require('path');
const { LEVELS, PACES, TIERS, TRACKS } = require('../curriculum');

const repo = path.resolve(__dirname, '..');
const data = { levels: LEVELS, paces: PACES, tiers: TIERS, tracks: TRACKS };

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Curriculum Pathways</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Zilla+Slab:wght@600;700&display=swap" rel="stylesheet">
<style>
:root{
  --encre:#16233A; --papier:#E9EAE3; --carte:#FAFAF6; --reglure:#C9CDBF;
  --tampon:#A83A2C; --vert:#2E5E4E; --ambre:#8A6A1F; --sourd:#616A5C;
  --sans:"Archivo",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  --slab:"Zilla Slab",Georgia,serif;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:var(--papier);color:var(--encre);font-family:var(--sans);
  font-size:15.5px;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:1000px;margin:0 auto;padding:0 20px 100px}

header.top{padding:30px 0 16px;border-bottom:2px solid var(--encre);margin-bottom:22px}
header.top h1{font-family:var(--slab);font-size:27px;font-weight:700;margin:0 0 5px}
header.top p{font-size:14px;color:var(--sourd);margin:0;max-width:64ch}

/* ---- the three choices ---- */
.picker{background:var(--carte);border:1px solid var(--reglure);border-radius:3px;
  padding:20px 22px;margin-bottom:22px}
.pickrow{margin-bottom:18px}
.pickrow:last-child{margin-bottom:0}
.pickrow > .lbl{font-size:12px;font-weight:700;color:var(--sourd);margin-bottom:8px;display:block}
.opts{display:flex;flex-wrap:wrap;gap:7px}
button.opt{font-family:var(--sans);font-size:14px;border:1px solid var(--reglure);
  background:#fff;color:var(--encre);border-radius:3px;padding:9px 14px;cursor:pointer;text-align:left}
button.opt:hover{border-color:var(--encre)}
button.opt[aria-pressed="true"]{background:var(--encre);color:#fff;border-color:var(--encre);font-weight:600}
button.opt .sub{display:block;font-size:11.5px;opacity:.72;font-weight:400;margin-top:1px}

/* ---- the answer ---- */
.answer{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:22px}
.stat{background:var(--carte);border:1px solid var(--reglure);border-radius:3px;padding:14px 16px}
.stat .n{font-family:var(--slab);font-size:26px;font-weight:700;line-height:1.1}
.stat .k{font-size:12px;color:var(--sourd);margin-top:3px}
.stat.warn{border-color:var(--tampon);background:#FDF4F1}
.stat.warn .n{color:var(--tampon)}

.note{border-left:3px solid var(--ambre);background:#FBF7EC;padding:11px 14px;
  margin-bottom:22px;font-size:13.5px;line-height:1.55}
.note b{font-weight:600}

/* ---- lesson list ---- */
.mod{margin-top:24px}
.mod > h3{font-family:var(--slab);font-size:16px;margin:0 0 2px}
.mod > .modmeta{font-size:12px;color:var(--sourd);margin:0 0 4px}
.mod > .modnote{font-size:12.5px;color:var(--sourd);font-style:italic;margin:0 0 9px;
  border-left:2px solid var(--reglure);padding-left:10px}
.les{background:var(--carte);border:1px solid var(--reglure);border-radius:3px;
  padding:12px 14px;margin-bottom:7px}
.les .hd{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
.les .code{font-variant-numeric:tabular-nums;font-weight:600;font-size:13px;color:var(--sourd)}
.les .ti{font-weight:600;font-size:14.5px;flex:1;min-width:200px}
.les .hrs{font-size:12px;color:var(--sourd)}
.les ul{margin:8px 0 0;padding-left:18px;font-size:13.5px;color:var(--encre)}
.les li{margin-bottom:3px}
.les .fr{color:var(--sourd);font-size:12.5px;display:block;margin-top:1px}

.tag{font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:2px;white-space:nowrap}
.tag.scaffold{background:#EDEEE6;color:var(--sourd)}
.tag.core{background:#E4EDE7;color:var(--vert)}
.tag.extension{background:#E9EBF2;color:#4A5B78}
.tag.advanced{background:#F7E7E4;color:var(--tampon)}
.tag.lvl{background:#F2EFE6;color:var(--ambre)}

.trackhead{margin-top:34px;padding:12px 16px;border-radius:3px;color:#fff;
  font-family:var(--slab);font-size:17px;font-weight:700}
.trackhead .sub{font-family:var(--sans);font-size:12.5px;font-weight:400;opacity:.85;display:block;margin-top:2px}

.langbar{display:flex;gap:8px;justify-content:flex-end;margin-bottom:14px}
button.lang{font-family:var(--sans);font-size:13px;border:1px solid var(--reglure);
  background:#fff;color:var(--sourd);border-radius:20px;padding:6px 14px;cursor:pointer}
button.lang[aria-pressed="true"]{background:var(--encre);color:#fff;border-color:var(--encre);font-weight:600}

.empty{background:var(--carte);border:1px dashed var(--reglure);border-radius:3px;
  padding:26px;text-align:center;color:var(--sourd);font-style:italic}
footer{margin-top:40px;padding-top:18px;border-top:1px solid var(--reglure);
  font-size:12.5px;color:var(--sourd);line-height:1.6;max-width:72ch}
</style>
</head>
<body>
<div class="wrap">

<header class="top">
  <h1>Curriculum pathways</h1>
  <p>Every lesson is written once. A pathway is a filter over them — choose
     who is starting and how fast, and this shows exactly what that cohort gets.</p>
</header>

<div class="langbar">
  <button class="lang" data-lang="en" aria-pressed="true">English</button>
  <button class="lang" data-lang="fr" aria-pressed="false">Français</button>
</div>

<div class="picker">
  <div class="pickrow"><span class="lbl" id="lblLevel">WHERE THEY ARE STARTING</span>
    <div class="opts" id="levels"></div></div>
  <div class="pickrow"><span class="lbl" id="lblPace">HOW FAST</span>
    <div class="opts" id="paces"></div></div>
  <div class="pickrow"><span class="lbl" id="lblTrack">WHICH BRANCH</span>
    <div class="opts" id="branches"></div></div>
</div>

<div class="answer" id="stats"></div>
<div id="warning"></div>
<div id="out"></div>

<footer id="foot"></footer>
</div>

<script>
const DATA = ${JSON.stringify(data)};

const T = {
  en: {
    level: 'WHERE THEY ARE STARTING', pace: 'HOW FAST', track: 'WHICH BRANCH',
    lessons: 'lessons', objectives: 'objectives', hours: 'teaching hours',
    daysFull: 'days full time', weeksPart: 'weeks part time',
    of: 'of', foundation: 'Foundation', branch: 'Branch',
    empty: 'Nothing in this pathway.',
    thin: 'This pathway is very short. At this entry level most of the curriculum is material the learner already has, so what remains is a specialisation rather than a programme. If an advanced cohort needs a full term, the branches need more material written at that level.',
    same: 'Steady and Standard produce the same pathway here, because there is no extra support material written above L1. That is a gap worth filling if this cohort is expected to struggle.',
    foot: 'Hours are first guesses and should be corrected against what sessions actually take — the daily log already records which lessons were covered on which day. Full time assumes four teaching hours a day, which is what a cohort sustains once breaks and setup are counted. Part time assumes two evenings a week.',
  },
  fr: {
    level: 'NIVEAU DE DÉPART', pace: 'RYTHME', track: 'FILIÈRE',
    lessons: 'leçons', objectives: 'objectifs', hours: "heures d'enseignement",
    daysFull: 'jours à plein temps', weeksPart: 'semaines à temps partiel',
    of: 'sur', foundation: 'Tronc commun', branch: 'Filière',
    empty: 'Rien dans ce parcours.',
    thin: "Ce parcours est très court. À ce niveau d'entrée, l'essentiel du programme est déjà acquis : ce qui reste est une spécialisation, pas une formation complète. Si une cohorte avancée doit occuper un trimestre, il faut écrire davantage de contenu à ce niveau.",
    same: "Progressif et Standard donnent ici le même parcours, faute de contenu d'étayage écrit au-dessus de N1. Une lacune à combler si cette cohorte risque d'être en difficulté.",
    foot: "Les durées sont des estimations à corriger d'après le temps réellement passé — le journal quotidien enregistre déjà quelles leçons ont été traitées et quand. Le plein temps suppose quatre heures d'enseignement par jour, ce qu'une cohorte tient réellement une fois pauses et installation comptées.",
  },
};

let lang = 'en';
let entryLevel = 'L0';
let pace = 'standard';
let branch = 'DEV';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pick = (v) => !v ? '' : (typeof v === 'string' ? v : (v[lang] ?? v.en ?? v.fr ?? ''));
const t = (k) => T[lang][k];

const rankOf = (code) => (DATA.levels.find((l) => l.code === code) || DATA.levels[0]).rank;

function inPathway(lesson) {
  const p = DATA.paces.find((x) => x.code === pace);
  if (rankOf(lesson.level) < rankOf(entryLevel)) return false;
  return p.tiers.includes(lesson.tier);
}

function resolve(lv, pc, br) {
  const savedL = entryLevel, savedP = pace;
  entryLevel = lv; pace = pc;
  const out = [];
  for (const track of DATA.tracks) {
    if (track.kind !== 'foundation' && track.code !== br) continue;
    for (const mod of track.modules) {
      const lessons = mod.lessons.filter(inPathway);
      if (lessons.length) out.push({ track, mod, lessons });
    }
  }
  entryLevel = savedL; pace = savedP;
  return out;
}

function render() {
  document.documentElement.lang = lang;
  document.getElementById('lblLevel').textContent = t('level');
  document.getElementById('lblPace').textContent = t('pace');
  document.getElementById('lblTrack').textContent = t('track');
  document.getElementById('foot').textContent = t('foot');

  document.getElementById('levels').innerHTML = DATA.levels.map((l) =>
    \`<button class="opt" data-level="\${l.code}" aria-pressed="\${l.code === entryLevel}">
       \${esc(l.code)} · \${esc(pick(l.name))}<span class="sub">\${esc(pick(l.desc))}</span></button>\`).join('');
  document.getElementById('paces').innerHTML = DATA.paces.map((p) =>
    \`<button class="opt" data-pace="\${p.code}" aria-pressed="\${p.code === pace}">
       \${esc(pick(p.name))}<span class="sub">\${esc(pick(p.desc))}</span></button>\`).join('');
  document.getElementById('branches').innerHTML = DATA.tracks.filter((x) => x.kind === 'course').map((x) =>
    \`<button class="opt" data-branch="\${x.code}" aria-pressed="\${x.code === branch}">
       \${esc(pick(x.name))}<span class="sub">\${esc(pick(x.blurb))}</span></button>\`).join('');

  const groups = resolve(entryLevel, pace, branch);
  const lessons = groups.flatMap((g) => g.lessons);
  const hours = lessons.reduce((n, l) => n + (l.hours || 0), 0);
  const objectives = lessons.reduce((n, l) => n + l.objectives.length, 0);
  const totalLessons = DATA.tracks.filter((x) => x.kind === 'foundation' || x.code === branch)
    .reduce((n, tr) => n + tr.modules.reduce((k, m) => k + m.lessons.length, 0), 0);

  const thin = lessons.length < 20;
  document.getElementById('stats').innerHTML = \`
    <div class="stat \${thin ? 'warn' : ''}"><div class="n">\${lessons.length}</div>
      <div class="k">\${esc(t('lessons'))} \${esc(t('of'))} \${totalLessons}</div></div>
    <div class="stat"><div class="n">\${objectives}</div><div class="k">\${esc(t('objectives'))}</div></div>
    <div class="stat"><div class="n">\${hours}</div><div class="k">\${esc(t('hours'))}</div></div>
    <div class="stat"><div class="n">\${Math.ceil(hours / 4)}</div><div class="k">\${esc(t('daysFull'))}</div></div>
    <div class="stat"><div class="n">\${Math.ceil(hours / 6)}</div><div class="k">\${esc(t('weeksPart'))}</div></div>\`;

  // Two honest warnings, shown only when they apply.
  const steadyN = resolve(entryLevel, 'steady', branch).flatMap((g) => g.lessons).length;
  const standardN = resolve(entryLevel, 'standard', branch).flatMap((g) => g.lessons).length;
  const warns = [];
  if (thin) warns.push(t('thin'));
  if (steadyN === standardN && pace !== 'fast') warns.push(t('same'));
  document.getElementById('warning').innerHTML = warns.map((w) => \`<div class="note">\${esc(w)}</div>\`).join('');

  if (!lessons.length) {
    document.getElementById('out').innerHTML = \`<div class="empty">\${esc(t('empty'))}</div>\`;
    return wire();
  }

  let html = '';
  let lastTrack = null;
  for (const g of groups) {
    if (g.track.code !== lastTrack) {
      const n = groups.filter((x) => x.track.code === g.track.code)
        .reduce((k, x) => k + x.lessons.length, 0);
      const h = groups.filter((x) => x.track.code === g.track.code)
        .reduce((k, x) => k + x.lessons.reduce((j, l) => j + l.hours, 0), 0);
      html += \`<div class="trackhead" style="background:\${g.track.color}">
        \${esc(pick(g.track.name))}
        <span class="sub">\${esc(g.track.kind === 'foundation' ? t('foundation') : t('branch'))} · \${n} \${esc(t('lessons'))} · \${h}h</span></div>\`;
      lastTrack = g.track.code;
    }
    const mh = g.lessons.reduce((k, l) => k + l.hours, 0);
    html += \`<div class="mod">
      <h3>\${esc(g.mod.code)} · \${esc(pick(g.mod.title))}</h3>
      <p class="modmeta">\${g.lessons.length} \${esc(t('lessons'))} · \${mh}h</p>
      \${g.mod.note ? \`<p class="modnote">\${esc(pick(g.mod.note))}</p>\` : ''}
      \${g.lessons.map((l) => \`
        <div class="les">
          <div class="hd">
            <span class="code">\${esc(l.code)}</span>
            <span class="ti">\${esc(pick(l.title))}</span>
            <span class="tag lvl">\${esc(l.level)}</span>
            <span class="tag \${l.tier}">\${esc(pick((DATA.tiers.find((x) => x.code === l.tier) || {}).name))}</span>
            <span class="hrs">\${l.hours}h</span>
          </div>
          \${l.note ? \`<p class="modnote" style="margin:7px 0 0">\${esc(pick(l.note))}</p>\` : ''}
          <ul>\${l.objectives.map((o) => \`<li>\${esc(pick(o.text))}</li>\`).join('')}</ul>
        </div>\`).join('')}
    </div>\`;
  }
  document.getElementById('out').innerHTML = html;
  wire();
}

function wire() {
  document.querySelectorAll('[data-level]').forEach((b) =>
    b.onclick = () => { entryLevel = b.dataset.level; render(); });
  document.querySelectorAll('[data-pace]').forEach((b) =>
    b.onclick = () => { pace = b.dataset.pace; render(); });
  document.querySelectorAll('[data-branch]').forEach((b) =>
    b.onclick = () => { branch = b.dataset.branch; render(); });
  document.querySelectorAll('[data-lang]').forEach((b) =>
    b.onclick = () => {
      lang = b.dataset.lang;
      document.querySelectorAll('[data-lang]').forEach((x) =>
        x.setAttribute('aria-pressed', x.dataset.lang === lang));
      render();
    });
}

render();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(repo, 'docs/pathways.html'), page);
console.log(`Wrote docs/pathways.html  (${Math.round(page.length / 1024)}KB)`);
