/**
 * Pas `vite build`, shkruan te `dist/sw.js` listën e saktë të skedarëve që duhen
 * paracache-uar dhe një version që ndryshon sa herë ndryshon përmbajtja.
 *
 * Përdorimi:  node scripts/pergatit-sw.mjs   (thirret vetvetiu nga `npm run build`)
 *
 * Pa këtë hap, skedarët te `/assets/` do të ruheshin vetëm pasi service worker-i të
 * merrte kontrollin — pra jo gjatë vizitës së parë — dhe faqja nuk do të hapej pa
 * internet derisa të vizitohej dy herë.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const rrenja = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

/** Të gjithë skedarët nën `dist/`, si shtigje me `/` në fillim. */
function skedaret(dir = rrenja) {
  return readdirSync(dir).flatMap((emri) => {
    const shtegu = join(dir, emri);
    return statSync(shtegu).isDirectory()
      ? skedaret(shtegu)
      : [`/${relative(rrenja, shtegu).split(/[\\/]/).join('/')}`];
  });
}

const tegjithe = skedaret();

// `/` mbulon index.html; sw.js nuk e cache-on veten, dhe ikonat e mëdha nuk ia
// vlen t'i shkarkojmë para kohe — i merr kur t'i duhen. `ndarje.png` e shikojnë
// vetëm robotët e WhatsApp-it e të Facebook-ut, kurrë përdoruesi, prandaj do të
// ishte 5 kB të shkarkuara kot për secilin.
const jashteParacachit = new Set([
  '/sw.js',
  '/index.html',
  '/ikona-512.png',
  '/ikona-maskable-512.png',
  '/apple-touch-icon.png',
  '/ndarje.png',
]);

const paracache = ['/', ...tegjithe.filter((f) => !jashteParacachit.has(f))];

// Versioni ndjek përmbajtjen: deploy pa ndryshime nuk e zbraz cache-in kot.
const hash = createHash('sha256');
for (const f of [...tegjithe].sort()) {
  hash.update(f);
  hash.update(readFileSync(join(rrenja, f.slice(1))));
}
const versioni = `kujdestaria-${hash.digest('hex').slice(0, 12)}`;

const shtegu = join(rrenja, 'sw.js');
const origjinali = readFileSync(shtegu, 'utf8');

let dalja = origjinali
  .replace(/^const VERSIONI = .*$/m, `const VERSIONI = ${JSON.stringify(versioni)};`)
  .replace(
    /^const PARACACHE = .*$/m,
    `const PARACACHE = ${JSON.stringify(paracache.sort())};`,
  );

if (dalja === origjinali) {
  console.error('gabim: nuk u zëvendësuan VERSIONI/PARACACHE te dist/sw.js');
  process.exit(1);
}

writeFileSync(shtegu, dalja, 'utf8');
console.log(`sw.js → ${versioni} · ${paracache.length} skedarë në paracache`);
for (const f of paracache) console.log(`   ${f}`);

/**
 * `og:image` shkruhet me rrugë relative te `index.html`, sepse domeni nuk dihet
 * kur shkruhet kodi. Robotët e WhatsApp-it e të Facebook-ut kërkojnë URL absolute,
 * prandaj po qe se dihet domeni — `KUJDESTARIA_BAZA`, ose ai që jep Vercel-i vetë
 * — rruga plotësohet tani. Pa të, imazhi mbetet relativ: Facebook-u zakonisht e
 * zgjidh, WhatsApp-i mund të mos e zgjidhë.
 */
const baza =
  process.env.KUJDESTARIA_BAZA ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null);

const faqja = join(rrenja, 'index.html');
const html = readFileSync(faqja, 'utf8');

if (!baza) {
  console.log('og:image → mbetet relativ (pa KUJDESTARIA_BAZA as domen nga Vercel-i)');
} else {
  const iPlote = html.replace(
    /(<meta property="og:image" content=")\/ndarje\.png(")/,
    `$1${baza.replace(/\/$/, '')}/ndarje.png$2`,
  );
  if (iPlote === html) {
    console.error('gabim: nuk u gjet meta og:image te dist/index.html');
    process.exit(1);
  }
  writeFileSync(faqja, iPlote, 'utf8');
  console.log(`og:image → ${baza.replace(/\/$/, '')}/ndarje.png`);
}
