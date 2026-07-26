/**
 * Provat e logjikës së kohës — pjesa që gabon pa u dukur.
 *
 * Ora vendoset në zonën e Kosovës para se të lexohet ndonjë datë, që provat të
 * dalin njësoj në çdo makinë dhe të matin pikërisht atë zonë ku faqja përdoret.
 */
process.env.TZ = 'Europe/Belgrade';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dataShkurt,
  dataShqip,
  dataSot,
  ditaShkurt,
  emriIMuajit,
  emriIMuajitShkurt,
  gjendjaEKujdestarise,
  kohaShkurt,
  neMinuta,
  zhvendosDite,
} from '../src/koha.js';

const NATA = { prej: '22:00', deri: '08:00' };

/** Një moment i saktë sipas orës lokale, pa varësi nga zona e makinës. */
const ne = (data, ora) => new Date(`${data}T${ora}:00`);

test('neMinuta e kthen orën në minuta nga mesnata', () => {
  assert.equal(neMinuta('00:00'), 0);
  assert.equal(neMinuta('08:00'), 480);
  assert.equal(neMinuta('22:00'), 1320);
  assert.equal(neMinuta('23:59'), 1439);
});

test('zhvendosDite kalon muajt, vitet dhe ndërrimin e orës verore', () => {
  assert.equal(zhvendosDite('2026-07-01', -1), '2026-06-30');
  assert.equal(zhvendosDite('2026-07-31', 1), '2026-08-01');
  assert.equal(zhvendosDite('2026-12-31', 1), '2027-01-01');
  assert.equal(zhvendosDite('2027-01-01', -1), '2026-12-31');
  // 29.03.2026 fillon ora verore; 25.10.2026 mbaron. Llogaritja është në UTC,
  // prandaj as një ditë nuk humbet e as nuk përsëritet.
  assert.equal(zhvendosDite('2026-03-29', -1), '2026-03-28');
  assert.equal(zhvendosDite('2026-03-28', 1), '2026-03-29');
  assert.equal(zhvendosDite('2026-10-25', -1), '2026-10-24');
  assert.equal(zhvendosDite('2026-10-24', 1), '2026-10-25');
});

test('dataSot ndjek orën lokale, jo UTC-në', () => {
  // Në zonën e Kosovës kjo është 23:30 e datës 26; me `toISOString()` do të
  // dilte 27.07 gjatë verës — pikërisht gabimi që `dataSot` shmang.
  assert.equal(dataSot(ne('2026-07-26', '23:30')), '2026-07-26');
  assert.equal(dataSot(ne('2026-07-26', '00:10')), '2026-07-26');
  assert.equal(dataSot(ne('2026-01-15', '23:59')), '2026-01-15');
});

test('formatimi i datave dhe i ditëve', () => {
  assert.equal(dataShqip('2026-07-01'), '01.07.2026');
  assert.equal(dataShkurt('2026-07-01'), '01.07');
  assert.equal(emriIMuajit('2026-11'), 'Nëntor 2026');
  assert.equal(emriIMuajitShkurt('2026-07'), 'Korrik');

  assert.deepEqual(
    ['E hënë', 'E martë', 'E mërkurë', 'E enjte', 'E premte', 'E shtunë', 'E diel'].map(ditaShkurt),
    ['Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht', 'Die'],
  );
});

test('kohaShkurt nuk shkruan zero kot', () => {
  assert.equal(kohaShkurt(0), '0 min');
  assert.equal(kohaShkurt(1), '1 min');
  assert.equal(kohaShkurt(59), '59 min');
  assert.equal(kohaShkurt(60), '1 h');
  assert.equal(kohaShkurt(97), '1 h 37 min');
  assert.equal(kohaShkurt(600), '10 h');
});

test('gjendja e kujdestarisë në kufijtë e ditës', () => {
  const rastet = [
    // [ora, faza, nata që vlen, mbeten, kaluar]
    ['00:00', 'nate', '2026-07-25', 480, 120],
    ['00:01', 'nate', '2026-07-25', 479, 121],
    ['03:30', 'nate', '2026-07-25', 270, 330],
    ['07:59', 'nate', '2026-07-25', 1, 599],
    ['08:00', 'dite', '2026-07-26', 840, 0],
    ['08:01', 'dite', '2026-07-26', 839, 0],
    ['12:00', 'dite', '2026-07-26', 600, 0],
    ['21:59', 'dite', '2026-07-26', 1, 0],
    ['22:00', 'nate', '2026-07-26', 600, 0],
    ['22:01', 'nate', '2026-07-26', 599, 1],
    ['23:59', 'nate', '2026-07-26', 481, 119],
  ];

  for (const [ora, faza, nata, mbeten, kaluar] of rastet) {
    const g = gjendjaEKujdestarise(ne('2026-07-26', ora), NATA);
    assert.equal(g.faza, faza, `faza në ${ora}`);
    assert.equal(g.natenIsFilloi, nata, `nata në ${ora}`);
    assert.equal(g.mbeten, mbeten, `mbeten në ${ora}`);
    assert.equal(g.kaluar, kaluar, `kaluar në ${ora}`);
    assert.equal(g.gjatesia, 600);
  }
});

test('pas mesnate vlen ende barnatorja e datës së djeshme', () => {
  // Arsyeja pse `kujdestariaPer(dataSot())` nuk mjafton.
  const g = gjendjaEKujdestarise(ne('2026-08-01', '02:00'), NATA);
  assert.equal(g.natenIsFilloi, '2026-07-31');
  assert.equal(g.faza, 'nate');
});

test('nata e fundvitit i takon datës që e nisi', () => {
  const g = gjendjaEKujdestarise(ne('2027-01-01', '01:00'), NATA);
  assert.equal(g.natenIsFilloi, '2026-12-31');
});

test('në çdo minutë të ditës gjendja mbetet e qëndrueshme', () => {
  for (let minuta = 0; minuta < 24 * 60; minuta++) {
    const ora = `${String(Math.floor(minuta / 60)).padStart(2, '0')}:${String(minuta % 60).padStart(2, '0')}`;
    const g = gjendjaEKujdestarise(ne('2026-09-15', ora), NATA);

    // Numërimi nuk arrin kurrë zero: në kufi kalon te faza tjetër.
    assert.ok(g.mbeten > 0, `mbeten duhet pozitiv në ${ora}`);
    assert.ok(g.kaluar >= 0 && g.kaluar < g.gjatesia, `kaluar brenda kufijve në ${ora}`);

    if (g.faza === 'nate') {
      // Shiriti i faqes vizatohet me `kaluar / gjatesia`; kjo e mban të saktë.
      assert.equal(g.kaluar + g.mbeten, g.gjatesia, `kaluar + mbeten = gjatësia në ${ora}`);
      assert.ok(g.mbeten <= g.gjatesia, `mbeten nuk kalon natën në ${ora}`);
      assert.ok(
        g.natenIsFilloi === '2026-09-15' || g.natenIsFilloi === '2026-09-14',
        `nata është ajo e sotmja ose e djeshmja në ${ora}`,
      );
    } else {
      assert.equal(g.kaluar, 0, `ditën nata nuk ka filluar (${ora})`);
      // Pritja ditën shkon deri sa mbush orarin e rregullt, jo natën.
      assert.ok(g.mbeten <= 24 * 60 - g.gjatesia, `mbeten nuk kalon orarin e rregullt në ${ora}`);
      assert.equal(g.natenIsFilloi, '2026-09-15');
    }
  }
});

test('një dritare tjetër kohore llogaritet njësoj', () => {
  // Nëse komuna e ndryshon orarin, logjika nuk duhet të varet nga 22:00–08:00.
  const g = gjendjaEKujdestarise(ne('2026-07-26', '21:00'), { prej: '20:00', deri: '07:00' });
  assert.equal(g.faza, 'nate');
  assert.equal(g.gjatesia, 11 * 60);
  assert.equal(g.kaluar, 60);
  assert.equal(g.mbeten, 10 * 60);
});
