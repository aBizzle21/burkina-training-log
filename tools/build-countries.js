/*
 * Every country, in English and French, as a file the admin page loads.
 *
 * Generated rather than typed. A hand-written list of 249 countries is a
 * list with mistakes in it, and the names have to be right in both
 * languages — "Côte d'Ivoire" with the correct apostrophe, "Éthiopie"
 * with the accent. Node's own ICU data has them, so they come from there.
 *
 * Written to a file instead of computed per request because it never
 * changes between deploys and the admin page wants it once.
 *
 *   node tools/build-countries.js
 */

const fs = require('fs');
const path = require('path');

// ISO 3166-1 alpha-2. Taken as the input set; the names come from ICU.
const CODES = (
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI ' +
  'BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN ' +
  'CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK ' +
  'FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM ' +
  'HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN ' +
  'KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ' +
  'ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP ' +
  'NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW ' +
  'SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF ' +
  'TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI ' +
  'VN VU WF WS YE YT ZA ZM ZW'
).split(' ');

const en = new Intl.DisplayNames(['en'], { type: 'region' });
const fr = new Intl.DisplayNames(['fr'], { type: 'region' });

/*
 * Accents off, apostrophes normalised, lower case — what the type-ahead
 * matches against. Somebody typing "cote d'ivoire" on a phone keyboard
 * with no accents should still find Côte d'Ivoire, and the curly
 * apostrophe ICU returns is not the one on anybody's keyboard.
 */
const fold = (s) => s
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[‘’ʼ]/g, "'")
  .toLowerCase();

/*
 * What people actually type, where it differs from the official name.
 * Without these, "USA" finds nothing — the official name is "United
 * States" — and somebody concludes the country is missing.
 */
const ALIASES = {
  US: 'usa america etats-unis', GB: 'uk britain england scotland wales',
  AE: 'uae emirates', CI: 'ivory coast', CD: 'drc congo-kinshasa',
  CG: 'congo-brazzaville', CZ: 'czech republic', MM: 'burma',
  SZ: 'swaziland', TR: 'turkey turquie', NL: 'holland', CV: 'cape verde',
  KR: 'korea', KP: 'north korea', RU: 'russia', VN: 'vietnam',
  MK: 'macedonia', TL: 'east timor', VA: 'vatican', LA: 'laos',
  SY: 'syria', IR: 'iran', BO: 'bolivia', VE: 'venezuela', TZ: 'tanzania',
};

const countries = CODES
  .map((code) => {
    const nameEn = en.of(code);
    const nameFr = fr.of(code);
    // ICU returns the code itself when it has no name for it.
    if (!nameEn || nameEn === code) return null;
    return {
      code,
      en: nameEn,
      fr: nameFr && nameFr !== code ? nameFr : nameEn,
      // One search key covering both languages and the code, so a French
      // speaker typing "Éthiopie" and an English one typing "Ethiopia"
      // land on the same row.
      q: [...new Set([fold(nameEn), fold(nameFr || ''), code.toLowerCase(),
        ALIASES[code] || ''].filter(Boolean))].join(' | '),
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.en.localeCompare(b.en, 'en'));

const out = path.join(__dirname, '..', 'server', 'public', 'countries.json');
fs.writeFileSync(out, JSON.stringify(countries));
console.log('written', out);
console.log(countries.length, 'countries,', Math.round(fs.statSync(out).size / 1024), 'KB');
console.log('spot check:',
  countries.filter((c) => ['BF', 'CI', 'ET', 'SN'].includes(c.code))
    .map((c) => `${c.code} ${c.en} / ${c.fr}`).join('  |  '));
