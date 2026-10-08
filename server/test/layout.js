/*
 * Layout faults a person would notice, found by measuring the page.
 *
 * Every rule here is one that has actually reached a screen:
 *
 *   floating-middle   A row spreading three things evenly, so the middle
 *                     one ("nothing yet", "4 lessons") lands wherever the
 *                     gap falls — a different place on every row.
 *   sideways-scroll   The page wider than the screen. A bar 32px too wide
 *                     made every phone scroll sideways.
 *   off-screen        Something past the right edge of the screen.
 *   spills            Content wider than the box it sits in.
 *   overlap           Two things drawn on top of each other.
 *   small-tap-target  On a phone, a button too small to hit reliably.
 *
 * Runs inside the page: pass `layoutFaults` to page.evaluate().
 */

function layoutFaults() {
  const found = [];
  const shown = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const name = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    if (typeof el.className === 'string' && el.className.trim()) {
      s += '.' + el.className.trim().split(/\s+/).join('.');
    }
    return s;
  };
  const where = (el) => {
    const parts = [];
    let e = el;
    for (let i = 0; i < 3 && e && e !== document.body; i++) { parts.unshift(name(e)); e = e.parentElement; }
    return parts.join(' > ');
  };
  const text = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);
  const inFlow = (el) => !['absolute', 'fixed', 'sticky'].includes(getComputedStyle(el).position);

  if (document.documentElement.scrollWidth > innerWidth + 1) {
    found.push(`sideways-scroll: page is ${document.documentElement.scrollWidth}px on a ${innerWidth}px screen`);
  }

  for (const el of document.querySelectorAll('body *')) {
    if (!shown(el)) continue;
    // Inside a closed section: not drawn, though the browser reports a box.
    const shut = el.closest('details:not([open])');
    if (shut && el !== shut && !el.closest('summary')) continue;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();

    if (cs.display.includes('flex') && cs.flexDirection.startsWith('row')
        && cs.justifyContent === 'space-between') {
      const kids = [...el.children].filter((k) => shown(k) && inFlow(k));
      let n = kids.length;
      for (const p of ['::before', '::after']) {
        const ps = getComputedStyle(el, p);
        if (ps.content && ps.content !== 'none' && ps.display !== 'none') n++;
      }
      if (n >= 3 && !kids.some((k) => parseFloat(getComputedStyle(k).flexGrow) > 0)) {
        found.push(`floating-middle: ${where(el)} "${text(el)}"`);
      }
    }

    if (cs.display !== 'inline' && cs.overflowX === 'visible'
        && !['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)
        && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2) {
      found.push(`spills: ${where(el)} ${el.scrollWidth}px in ${el.clientWidth}px`);
    }

    if (r.right > innerWidth + 1 && cs.position !== 'fixed') {
      found.push(`off-screen: ${where(el)} reaches ${Math.round(r.right)}px`);
    }

    if (innerWidth < 500
        && el.matches('button, summary, select, input:not([type=checkbox]):not([type=radio])')
        && r.height < 30) {
      found.push(`small-tap-target: ${where(el)} ${Math.round(r.width)}x${Math.round(r.height)} "${text(el)}"`);
    }

    const kids = [...el.children].filter((k) => shown(k) && inFlow(k)
      && getComputedStyle(k).display !== 'inline'
      && !(k.parentElement.tagName === 'DETAILS' && !k.parentElement.open && k.tagName !== 'SUMMARY'));
    for (let i = 0; i < kids.length; i++) {
      for (let j = i + 1; j < kids.length; j++) {
        const a = kids[i].getBoundingClientRect();
        const b = kids[j].getBoundingClientRect();
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (w > 2 && h > 2) {
          found.push(`overlap: ${where(el)}: ${name(kids[i])} / ${name(kids[j])}`);
        }
      }
    }
  }
  return [...new Set(found)];
}

module.exports = { layoutFaults };
