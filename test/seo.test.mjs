/**
 * Provat e asaj që lexojnë makinat: HTML-ja e gatshme te `dist/index.html` dhe
 * grafi JSON-LD.
 *
 * Këto pjesë nuk i sheh njeri kur prishen — faqja duket njësoj, thjesht pushon së
 * dali te kërkimi. Prandaj maten këtu: që orari të jetë vërtet brenda HTML-së, që
 * përgjigjet e `FAQPage`-it të jenë fjalë për fjalë ato që shfaqen në faqe (Google-i
 * i pranon vetëm ashtu), dhe që asnjë fushë e grafit të mos mbetet e zbrazët.
 */
process.env.TZ = 'Europe/Belgrade';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PERSHKRIMI, TITULLI, faqjaStatike, pyetjet, sig } from '../src/faqja.js';
import { skema } from '../src/skema.js';
import { orari, tëGjithaBarnatoret } from '../src/orari.js';

const faqja = faqjaStatike();
const grafi = skema({ baza: 'https://shembull.test', dataENdryshimit: '2026-07-26' });
const nyjet = grafi['@graph'];

/** Numëron sa herë del një varg, që „a ndodhet" të mos ngatërrohet me „sa herë". */
function sa(teksti, cfare) {
  return teksti.split(cfare).length - 1;
}

/* ── Titulli dhe përshkrimi ────────────────────────────────────────────── */

test('titulli hyn te rezultati i kërkimit pa u prerë', () => {
  assert.ok(TITULLI.length <= 60, `titulli ${TITULLI.length} shkronja`);
  assert.match(TITULLI, new RegExp(orari.komuna));
  assert.match(TITULLI, /kujdestar/i);
});

test('përshkrimi hyn te rezultati i kërkimit pa u prerë', () => {
  assert.ok(PERSHKRIMI.length <= 165, `përshkrimi ${PERSHKRIMI.length} shkronja`);
  assert.match(PERSHKRIMI, new RegExp(orari.komuna));
  assert.match(PERSHKRIMI, new RegExp(orari.orari.kujdestaria.prej));
});

/* ── Faqja e gatshme ───────────────────────────────────────────────────── */

test('faqja e gatshme ka një `h1` të vetëm', () => {
  assert.equal(sa(faqja, '<h1'), 1);
});

test('faqja e gatshme mban çdo natë të orarit', () => {
  for (const dita of orari.kujdestaria) {
    assert.ok(
      faqja.includes(`<time datetime="${dita.data}">`),
      `mungon nata ${dita.data} te HTML-ja e gatshme`,
    );
  }
  assert.equal(sa(faqja, '<table'), new Set(orari.kujdestaria.map((d) => d.data.slice(0, 7))).size);
});

test('faqja e gatshme i emëron të gjitha barnatoret', () => {
  for (const b of tëGjithaBarnatoret()) {
    assert.ok(faqja.includes(b.emri), `mungon barnatorja ${b.emri}`);
  }
});

test('faqja e gatshme nuk shënon asnjë natë si „tani"', () => {
  // HTML-ja shkruhet një herë dhe lexohet muaj më vonë; një „tani" i ngrirë aty
  // do të ishte gabim i sigurt.
  assert.equal(sa(faqja, 'rresht--tani'), 0);
  assert.equal(sa(faqja, 'shenja--tani'), 0);
});

test('faqja e gatshme nuk lë asnjë vend të pambushur', () => {
  assert.equal(sa(faqja, 'undefined'), 0);
  assert.equal(sa(faqja, '${'), 0);
  assert.equal(sa(faqja, '[object Object]'), 0);
});

/* ── Grafi JSON-LD ─────────────────────────────────────────────────────── */

test('grafi shkruhet si JSON i vlefshëm', () => {
  const teksti = JSON.stringify(grafi);
  assert.deepEqual(JSON.parse(teksti), grafi);
  // `</script` brenda vargjeve do ta mbyllte etiketën para kohe te `<head>`-i.
  assert.equal(sa(teksti.toLowerCase(), '</script'), 0);
});

test('çdo nyje ka `@id` të vetin dhe të papërsëritur', () => {
  const idte = nyjet.map((n) => n['@id']);
  assert.ok(idte.every(Boolean), 'një nyje pa `@id`');
  assert.equal(new Set(idte).size, idte.length);
});

test('çdo referencë `@id` gjendet te grafi', () => {
  const njohura = new Set(nyjet.map((n) => n['@id']));
  // Nën-organizata rri brenda nyjes së komunës, jo si nyje më vete.
  for (const n of nyjet) {
    if (n.subOrganization?.['@id']) njohura.add(n.subOrganization['@id']);
  }

  const kontrollo = (vlera) => {
    if (Array.isArray(vlera)) return vlera.forEach(kontrollo);
    if (!vlera || typeof vlera !== 'object') return;
    const vetem = Object.keys(vlera).length === 1 && vlera['@id'];
    if (vetem) assert.ok(njohura.has(vlera['@id']), `referencë e varur: ${vlera['@id']}`);
    Object.values(vlera).forEach(kontrollo);
  };

  nyjet.forEach(kontrollo);
});

test('barnatoret dalin si `Pharmacy` me orarin e rregullt', () => {
  const barnatoret = nyjet.filter((n) => n['@type'] === 'Pharmacy');
  assert.equal(barnatoret.length, tëGjithaBarnatoret().length);

  for (const b of barnatoret) {
    const burimi = tëGjithaBarnatoret().find((x) => x.emri === b.name);
    assert.ok(burimi, `barnatore e panjohur te grafi: ${b.name}`);
    assert.equal(b.address.addressLocality, orari.komuna);
    assert.equal(b.openingHoursSpecification[0].opens, orari.orari.iRregullt.prej);
    assert.equal(b.openingHoursSpecification[0].closes, orari.orari.iRregullt.deri);
    // Vetëm ajo që dihet: pa telefon te të dhënat, pa telefon te grafi.
    assert.equal('telephone' in b, Boolean(burimi.telefoni));
    assert.equal(b.hasMap ?? null, burimi.harta);
  }
});

test('grafi nuk mban fusha të zbrazëta', () => {
  const kontrollo = (vlera) => {
    if (Array.isArray(vlera)) return vlera.forEach(kontrollo);
    if (!vlera || typeof vlera !== 'object') return;
    for (const [emri, v] of Object.entries(vlera)) {
      assert.ok(v !== null && v !== undefined && v !== '', `fushë e zbrazët: ${emri}`);
      kontrollo(v);
    }
  };
  kontrollo(grafi);
});

test('përgjigjet e `FAQPage`-it duken edhe në faqe', () => {
  const faqePyetjesh = nyjet.find((n) => [].concat(n['@type']).includes('FAQPage'));
  assert.ok(faqePyetjesh, 'mungon `FAQPage`');
  assert.equal(faqePyetjesh.mainEntity.length, pyetjet().length);

  for (const { pyetja, pergjigjja } of pyetjet()) {
    const nyja = faqePyetjesh.mainEntity.find((q) => q.name === pyetja);
    assert.ok(nyja, `pyetja mungon te grafi: ${pyetja}`);
    assert.equal(nyja.acceptedAnswer.text, pergjigjja);
    // Google-i e pranon `FAQPage`-in vetëm nëse teksti shfaqet edhe për njerëzit.
    assert.ok(faqja.includes(sig(pergjigjja)), `përgjigjja nuk duket në faqe: ${pyetja}`);
  }
});

test('pa domen, `@id`-të mbeten relative dhe të vlefshme', () => {
  const paBaze = skema();
  for (const nyja of paBaze['@graph']) {
    assert.match(nyja['@id'], /^\/#/, `\`@id\` jo relativ: ${nyja['@id']}`);
  }
  // Adresat e jashtme — komuna, dokumenti, autori — mbeten absolute.
  const dokumenti = paBaze['@graph'].find((n) => n['@type'] === 'CreativeWork');
  assert.equal(dokumenti.url, orari.burimet.dokumenti);
});
