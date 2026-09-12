/**
 * Provat e temës: paleta e natës, skripta që e vendos temën para vizatimit, dhe
 * butonat e kreut.
 *
 * Tema ka dy pjesë që prishen pa u dukur. E para: paleta e natës ndizet nga dy
 * rregulla CSS — njëra për sistemin, tjetra për zgjedhjen e përdoruesit — dhe një
 * token i harruar te njëra do ta linte faqen gjysmë të errët vetëm për atë rrugë.
 * E dyta: `public/tema.js` duhet të mbetet skriptë e zakonshme, bllokuese te
 * `<head>`-i dhe jashtë paketës; po u bë modul ose u shty, tema do të vinte pas
 * vizatimit të parë — pra një ndezje e bardhë në ora 02:00.
 */
process.env.TZ = 'Europe/Belgrade';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { kreu } from '../src/faqja.js';

const rrenja = join(dirname(fileURLToPath(import.meta.url)), '..');
const lexo = (shtegu) => readFileSync(join(rrenja, shtegu), 'utf8');

const stili = lexo('src/style.css');
const skripta = lexo('public/tema.js');
const html = lexo('index.html');

/** Trupi i rregullit që fillon me `perzgjedhesi` — deri te kllapa e parë mbyllëse. */
function trupi(perzgjedhesi) {
  const fillimi = stili.indexOf(perzgjedhesi);
  assert.notEqual(fillimi, -1, `mungon rregulli \`${perzgjedhesi}\``);
  const hapja = stili.indexOf('{', fillimi);
  return stili.slice(hapja + 1, stili.indexOf('}', hapja));
}

/** `--sfond: var(--n-sfond)` → `sfond`, për çdo token të kaluar te paleta e natës. */
function kaluarit(trupi) {
  return [...trupi.matchAll(/--([\w-]+):\s*var\(--n-([\w-]+)\)/g)].map(([, emri, nata]) => {
    assert.equal(emri, nata, `\`--${emri}\` merr \`--n-${nata}\``);
    return emri;
  });
}

/* ── Paleta e natës ────────────────────────────────────────────────────── */

const sipasSistemit = kaluarit(trupi("  :root:not([data-tema='drite'])"));
const meZgjedhje = kaluarit(trupi(":root[data-tema='terr']"));

test('nata ndizet njësoj nga sistemi dhe nga zgjedhja', () => {
  // Dy rregulla, një paletë: çdo token duhet të kalojë te të dyja, përndryshe
  // njëra rrugë e lë faqen gjysmë të errët.
  assert.deepEqual(meZgjedhje, sipasSistemit);
});

test('çdo token i natës përdoret, dhe çdo token i përdorur ekziston', () => {
  const deklaruar = [...stili.matchAll(/^\s{2}--n-([\w-]+):/gm)].map(([, emri]) => emri);
  assert.ok(deklaruar.length > 0, 'mungon paleta e natës');
  assert.deepEqual([...deklaruar].sort(), [...sipasSistemit].sort());

  // Dhe secili ka çiftin e vet te paleta e ditës, te `:root`.
  for (const emri of deklaruar) {
    assert.match(stili, new RegExp(`^ {2}--${emri}:`, 'm'), `mungon \`--${emri}\` te dita`);
  }
});

test('zgjedhja e përdoruesit e merr me vete `color-scheme`', () => {
  // Pa të, shiritat e rrëshqitjes dhe fushat mbeten të temës së sistemit.
  assert.match(trupi(":root[data-tema='drite']"), /color-scheme:\s*light/);
  assert.match(trupi(":root[data-tema='terr']"), /color-scheme:\s*dark/);
});

test('shtypja del e bardhë edhe kur është zgjedhur terri', () => {
  // `:root[data-tema]` e barazon specifikën me zgjedhjen; pa të, terri do ta
  // mbizotëronte dhe faqja do të dilte e zezë në letër.
  assert.match(stili, /@media print \{\s*(?:\/\*[\s\S]*?\*\/\s*)?:root,\s*:root\[data-tema\] \{/);
});

/* ── Skripta para vizatimit ────────────────────────────────────────────── */

test('`tema.js` ngarkohet bllokuese te `<head>`-i, pas `theme-color`-ëve', () => {
  const koka = html.slice(0, html.indexOf('</head>'));
  const skripta = koka.indexOf('<script src="/tema.js"></script>');
  assert.notEqual(skripta, -1, 'mungon `<script src="/tema.js">` te `<head>`-i');
  assert.ok(
    skripta > koka.lastIndexOf('name="theme-color"'),
    '`tema.js` i lexon `<meta name="theme-color">`, prandaj duhet të rrijë pas tyre',
  );
});

test('`tema.js` mbetet skriptë e zakonshme, pa `import` e pa `export`', () => {
  // Një modul (ose një `defer`) do ta shtynte temën pas vizatimit të parë.
  assert.doesNotMatch(skripta, /^\s*(?:import|export)\s/m);
  assert.doesNotMatch(html, /<script[^>]*src="\/tema\.js"[^>]*(?:type=|defer|async)/);
});

test('vlerat e zgjedhjes janë të njëjtat te skripta dhe te butonat', () => {
  const njohura = ['sistemi', 'drite', 'terr'];
  assert.match(skripta, new RegExp(`ZGJEDHJET = \\[${njohura.map((z) => `'${z}'`).join(', ')}\\]`));
  for (const zgjedhja of njohura) {
    assert.ok(kreu().includes(`data-tema-zgjedh="${zgjedhja}"`), `mungon butoni „${zgjedhja}"`);
  }
});

/* ── Butonat e kreut ───────────────────────────────────────────────────── */

test('kreu i jep secilit buton emër të lexueshëm dhe gjendje', () => {
  const kokaEFaqes = kreu();
  assert.equal(kokaEFaqes.split('data-tema-zgjedh=').length - 1, 3);
  // Ikona vetëm nuk mjafton: emri shkon te `title` dhe te teksti për lexuesat e ekranit.
  for (const emri of ['Sipas sistemit', 'E çelët', 'E errët']) {
    assert.ok(kokaEFaqes.includes(`title="${emri}"`), `mungon \`title\` për „${emri}"`);
    assert.ok(kokaEFaqes.includes(`>${emri}</span>`), `mungon emri i lexueshëm „${emri}"`);
  }
  // Pa JavaScript nuk ka zgjedhje të ruajtur, prandaj i shtypur del „sistemi".
  assert.match(kokaEFaqes, /data-tema-zgjedh="sistemi"\s+aria-pressed="true"/);
  assert.equal(kokaEFaqes.split('aria-pressed="true"').length - 1, 1);
});
