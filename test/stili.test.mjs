/**
 * Provat e stilit: fonti i paketuar dhe sipërfaqet pa kalime.
 *
 * Të dyja janë vendime që një rresht i vetëm CSS-i i prish pa u vënë re. Një
 * `url()` drejt Google Fonts-it do të kalonte te zhvillimi dhe do të binte vetëm
 * te faqja e vërtetë, ku CSP-ja është `font-src 'self'` — dhe pa internet teksti
 * do të mbetej te fonti i sistemit. Një `gradient` i ri do të kthente përzierjen
 * smerald→cian pikërisht atje ku dy ngjyrat duhet të mbeten të dallueshme.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { shenjaEFaqes } from '../src/ikonat.js';

const rrenja = join(dirname(fileURLToPath(import.meta.url)), '..');
const lexo = (shtegu) => readFileSync(join(rrenja, shtegu), 'utf8');

const stili = lexo('src/style.css');

/* ── Fonti ─────────────────────────────────────────────────────────────── */

test('fonti vjen nga vetë paketa, jo nga një domen tjetër', () => {
  const burimi = stili.match(/@font-face \{[^}]*src:\s*url\('([^']+)'\)/);
  assert.ok(burimi, 'mungon `@font-face`-i i Quicksand-it');
  assert.doesNotMatch(burimi[1], /^https?:|^\/\//, 'fonti nuk guxon të vijë nga jashtë');
  assert.ok(
    existsSync(join(rrenja, 'src', burimi[1].replace(/^\.\//, ''))),
    `mungon skedari i fontit: ${burimi[1]}`,
  );
  // Pa `swap`, teksti rri i padukshëm derisa të vijë fonti — pikërisht përgjigjja që kërkohet.
  assert.match(stili, /@font-face \{[^}]*font-display:\s*swap/);
  assert.match(stili, /font-family:\s*'Quicksand',\s*system-ui/);
});

test('asnjë peshë mbi 700 — Quicksand nuk e ka', () => {
  const teRenda = [...stili.matchAll(/font-weight:\s*(\d+)/g)].filter(([, p]) => Number(p) > 700);
  assert.deepEqual(teRenda.map(([teksti]) => teksti), []);
});

/* ── Sipërfaqet ────────────────────────────────────────────────────────── */

test('asnjë kalim: as te CSS-i, as te SVG-të, as te favicon-i', () => {
  for (const [emri, teksti] of [
    ['src/style.css', stili],
    ['src/ikonat.js', lexo('src/ikonat.js')],
    ['index.html', lexo('index.html')],
    ['scripts/gjenero-ikonat.mjs', lexo('scripts/gjenero-ikonat.mjs')],
  ]) {
    assert.doesNotMatch(teksti, /gradient/i, `mbeti një kalim te ${emri}`);
  }
  // Shenja e faqes mbushet me ngjyrën e gjendjes „e hapur", jo me një `url(#…)`.
  assert.doesNotMatch(shenjaEFaqes(), /url\(#/);
  assert.match(stili, /\.marka__fusha \{\s*fill: var\(--hapur\);/);
});
