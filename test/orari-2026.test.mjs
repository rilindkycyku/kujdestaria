/**
 * Provat e të dhënave te `src/data/orari-2026.json`.
 *
 * Skedari gjenerohet nga `npm run gjenero`, prandaj këto prova mbrojnë kundër një
 * rigjenerimi të keq: një ditë e humbur, rotacion i shkëmbyer, ose datë e
 * projektuar e shënuar gabimisht si zyrtare. JSON-i lexohet me `readFile`, që
 * provat të punojnë pa bundler.
 */
process.env.TZ = 'Europe/Belgrade';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lidhjeHarteEVlefshme } from '../src/harta.js';
import { zhvendosDite } from '../src/koha.js';

const orari = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/data/orari-2026.json', import.meta.url)), 'utf8'),
);

const DITET = ['E hënë', 'E martë', 'E mërkurë', 'E enjte', 'E premte', 'E shtunë', 'E diel'];

test('periudha përputhet me rreshtat e vërtetë', () => {
  const ditet = orari.kujdestaria;
  assert.ok(ditet.length > 0);
  assert.equal(ditet.at(0).data, orari.periudha.prej);
  assert.equal(ditet.at(-1).data, orari.periudha.deri);
  assert.ok(orari.periudha.zyrtareDeri <= orari.periudha.deri);
});

test('datat janë të njëpasnjëshme, pa hapësira e pa përsëritje', () => {
  orari.kujdestaria.forEach((dita, i) => {
    if (i === 0) return;
    const pritej = zhvendosDite(orari.kujdestaria[i - 1].data, 1);
    assert.equal(dita.data, pritej, `pas ${orari.kujdestaria[i - 1].data} pritej ${pritej}`);
  });
});

test('dita e javës i përgjigjet datës', () => {
  for (const dita of orari.kujdestaria) {
    const numri = new Date(`${dita.data}T12:00:00Z`).getUTCDay();
    assert.equal(dita.dita, DITET[(numri + 6) % 7], `dita e ${dita.data}`);
  }
});

test('nata mbaron një ditë pas datës së saj', () => {
  for (const dita of orari.kujdestaria) {
    assert.equal(dita.kujdestaria.mbaronMe, zhvendosDite(dita.data, 1), `mbaronMe i ${dita.data}`);
    assert.equal(dita.kujdestaria.prej, orari.orari.kujdestaria.prej);
    assert.equal(dita.kujdestaria.deri, orari.orari.kujdestaria.deri);
  }
});

test('rotacioni 10-ditor ndjek radhën e shpallur', () => {
  assert.equal(orari.rotacioni.length, orari.projeksioni.gjatesiaECiklit);
  orari.kujdestaria.forEach((dita, i) => {
    const pozita = (i % orari.rotacioni.length) + 1;
    assert.equal(dita.pozitaNeCikel, pozita, `pozita e ${dita.data}`);
    assert.equal(dita.barnatorja, orari.rotacioni[pozita - 1], `barnatorja e ${dita.data}`);
  });
});

test('çdo barnatore e orarit ekziston te lista e barnatoreve', () => {
  const emrat = new Set(orari.barnatoret.map((b) => b.emri));
  for (const emri of orari.rotacioni) {
    assert.ok(emrat.has(emri), `${emri} mungon te barnatoret`);
  }
});

test('vetëm datat brenda dokumentit janë zyrtare', () => {
  for (const dita of orari.kujdestaria) {
    assert.equal(
      dita.zyrtare,
      dita.data <= orari.periudha.zyrtareDeri,
      `flamuri „zyrtare" i ${dita.data}`,
    );
  }
  // Duhet të ketë nga të dyja, përndryshe paralajmërimi i projeksionit nuk ka kuptim.
  assert.ok(orari.kujdestaria.some((d) => d.zyrtare));
  assert.ok(orari.kujdestaria.some((d) => !d.zyrtare));
});

test('sezoni ndërron te data e shpallur', () => {
  for (const dita of orari.kujdestaria) {
    const pritej = dita.data <= orari.sezonet.veror.mbaron ? 'veror' : 'dimeror';
    assert.equal(dita.sezoni, pritej, `sezoni i ${dita.data}`);
  }
  assert.equal(zhvendosDite(orari.sezonet.veror.mbaron, 1), orari.sezonet.dimeror.fillon);
});

test('lidhjet e hartave kalojnë validimin e faqes', () => {
  for (const b of orari.barnatoret) {
    if (!b.harta) continue;
    assert.ok(lidhjeHarteEVlefshme(b.harta), `lidhja e ${b.emri} nuk kalon`);
  }
});

test('orari i rregullt dhe kujdestaria nuk mbivendosen', () => {
  const { iRregullt, kujdestaria } = orari.orari;
  assert.equal(iRregullt.deri, kujdestaria.prej, 'kujdestaria fillon kur mbaron orari i rregullt');
  assert.equal(kujdestaria.deri, iRregullt.prej, 'kujdestaria mbaron kur fillon orari i rregullt');
});
