/*
 * Towns and cities for every country, in a few small files, for the
 * admin page's city suggestions.
 *
 * Split by the first letter of the country code — BF and BJ share b.json —
 * because the page only ever needs the cities of the country already
 * chosen. Shipping the whole world to every admin page would be ~400 KB.
 * Not one file per country: that is 249 files, and GitHub's upload page
 * takes at most 100 at a time.
 *
 * Which places are included:
 *   - every place of 10,000 people or more, and
 *   - for countries with few of those, the largest 60 places of any size,
 *     so a small country still offers something useful.
 * Training happens in villages no dataset lists, so the page treats these
 * as suggestions only — anything typed is accepted.
 *
 * Source: GeoNames (geonames.org, CC BY 4.0), via the all-the-cities npm
 * package. That package is a build-time tool only — it is not installed
 * on the server and is not in server/package.json.
 *
 *   npm install --no-save all-the-cities   (anywhere)
 *   CITIES_MODULE=/path/to/node_modules/all-the-cities node tools/build-cities.js
 */

const fs = require('fs');
const path = require('path');

const cities = require(process.env.CITIES_MODULE || 'all-the-cities');
const countries = require('../server/public/countries.json');

const MIN_POPULATION = 10000;
const AT_LEAST = 60;

const outDir = path.join(__dirname, '..', 'server', 'public', 'cities');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const byCountry = new Map();
for (const c of cities) {
  if (!byCountry.has(c.country)) byCountry.set(c.country, []);
  byCountry.get(c.country).push(c);
}

const groups = new Map();     // 'b' -> { BF: [...], BJ: [...] }
let total = 0;
for (const { code } of countries) {
  const list = (byCountry.get(code) || [])
    .sort((a, b) => b.population - a.population);

  // Largest first, so the suggestion list puts the capital above a
  // namesake village. The same name twice in one country (there are many
  // Springfields) is one suggestion: the page stores the name, not which
  // of them it was.
  const seen = new Set();
  const names = [];
  for (const c of list) {
    if (c.population < MIN_POPULATION && names.length >= AT_LEAST) break;
    const key = c.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(c.name);
  }

  // Every country gets an entry, even an empty one, so the page can tell
  // "no suggestions for this country" from "failed to load".
  const letter = code[0].toLowerCase();
  if (!groups.has(letter)) groups.set(letter, {});
  groups.get(letter)[code] = names;
  total += names.length;
}

let bytes = 0, biggest = ['', 0];
for (const [letter, byCode] of groups) {
  const file = path.join(outDir, `${letter}.json`);
  fs.writeFileSync(file, JSON.stringify(byCode));
  const size = fs.statSync(file).size;
  bytes += size;
  if (size > biggest[1]) biggest = [letter, size];
}

console.log(`${groups.size} files, ${countries.length} countries, ${total} places, ` +
  `${Math.round(bytes / 1024)} KB in all; largest ${biggest[0]}.json at ${Math.round(biggest[1] / 1024)} KB`);
for (const code of ['BF', 'CI', 'US', 'JP', 'VA']) {
  const names = JSON.parse(fs.readFileSync(path.join(outDir, `${code[0].toLowerCase()}.json`), 'utf8'))[code];
  console.log(`  ${code}: ${names.length} places — ${names.slice(0, 6).join(', ')}`);
}
for (const [letter, byCode] of groups) {
  const size = Math.round(fs.statSync(path.join(outDir, `${letter}.json`)).size / 1024);
  process.stdout.write(`${letter}:${size}KB `);
}
console.log();
