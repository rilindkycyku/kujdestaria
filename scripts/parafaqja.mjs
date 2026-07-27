/**
 * Pas `vite build`, e mbush `dist/index.html` me përmbajtje të gatshme dhe shkruan
 * `robots.txt` e `sitemap.xml`.
 *
 * Përdorimi:  node scripts/parafaqja.mjs   (thirret vetvetiu nga `npm run build`)
 *
 * Pa këtë hap, ajo që merr një kërkues është `<div id="app"></div>` — orari duket
 * vetëm pasi të ekzekutohet JavaScript-i. Google-i e ekzekuton, por Bing-u, Facebook-u,
 * WhatsApp-i dhe robotët e asistentëve zakonisht jo: për ta faqja do të ishte e zbrazët.
 * Prandaj orari i plotë shkruhet njëherë brenda HTML-së, bashkë me të dhënat e
 * strukturuara; `main.js` e zëvendëson me pamjen e drejtpërdrejtë sapo ngarkohet.
 *
 * Domeni nuk dihet kur shkruhet kodi, prandaj adresat absolute — `canonical`,
 * `og:url`, `og:image`, `sitemap.xml` — plotësohen këtu, nga `KUJDESTARIA_BAZA`
 * ose nga domeni që jep vetë Vercel-i.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PERSHKRIMI, TITULLI, faqjaStatike } from '../src/faqja.js';
import { skema } from '../src/skema.js';

const rrenja = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const faqja = join(rrenja, 'index.html');

/**
 * Domeni i faqes, pa `/` në fund. `VERCEL_PROJECT_PRODUCTION_URL` është domeni i
 * prodhimit — ai me emrin e vet, po qe se projektit i është vënë një i tillë.
 */
const baza = (
  process.env.KUJDESTARIA_BAZA ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : '')
)
  .trim()
  .replace(/\/$/, '');

const dataENdryshimit = new Date().toISOString().slice(0, 10);

let html = readFileSync(faqja, 'utf8');

/**
 * Zëvendësim që nuk lejohet të dështojë në heshtje: një `<meta>` i riemërtuar te
 * `index.html` do të kalonte pa u vënë re dhe faqja do të dilte pa të. Matet
 * përputhja, jo ndryshimi — një titull që rastis i njëjti nuk është gabim.
 */
function zevendeso(rregulli, iRi, cfare) {
  if (!rregulli.test(html)) {
    console.error(`gabim: nuk u gjet ${cfare} te dist/index.html`);
    process.exit(1);
  }
  html = html.replace(rregulli, iRi);
}

/** Vlera e `content`-it të një `<meta>`-je, e gjetur sipas `name`-it ose `property`-t. */
function meta(emri, vlera) {
  zevendeso(
    new RegExp(`(<meta\\s+(?:name|property)="${emri}"\\s+content=")[^"]*(")`),
    (_, para, pas) => `${para}${sig(vlera)}${pas}`,
    `<meta ${emri}>`,
  );
}

function sig(vlera) {
  return String(vlera).replace(
    /[&<>"']/g,
    (sh) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[sh],
  );
}

/* ── Titulli dhe përshkrimi ────────────────────────────────────────────── */

// Burimi është JSON-i i orarit, prandaj kur komuna publikon orarin e ri dhe
// rigjenerohen të dhënat, te rezultati i kërkimit nuk mbetet asnjë periudhë e vjetër.
zevendeso(/(<title>)[^<]*(<\/title>)/, (_, para, pas) => `${para}${sig(TITULLI)}${pas}`, '<title>');
meta('description', PERSHKRIMI);
meta('og:title', TITULLI);
meta('og:description', PERSHKRIMI);
meta('twitter:title', TITULLI);
meta('twitter:description', PERSHKRIMI);

/* ── Adresat absolute ──────────────────────────────────────────────────── */

// `canonical` dhe `og:url` shtohen vetëm kur domeni dihet: një adresë e gabuar
// aty është më keq se asnjë, sepse i thotë kërkuesit se faqja e vërtetë është diku tjetër.
// `og:image` gjithashtu: robotët e WhatsApp-it dhe të Facebook-ut e duan të plotë.
const koka = [];

if (baza) {
  koka.push(
    `<link rel="canonical" href="${baza}/" />`,
    `<meta property="og:url" content="${baza}/" />`,
  );
  meta('og:image', `${baza}/ndarje.png`);
  meta('twitter:image', `${baza}/ndarje.png`);
  console.log(`adresat absolute → ${baza}/`);
} else {
  console.log('adresat → mbeten relative (pa KUJDESTARIA_BAZA as domen nga Vercel-i)');
}

/* ── Të dhënat e strukturuara ──────────────────────────────────────────── */

// JSON-LD-ja është bllok të dhënash, jo skriptë që ekzekutohet, prandaj nuk e prek
// `script-src 'self'` e CSP-së. `</` brenda vargjeve do ta mbyllte etiketën para kohe.
const jsonLd = JSON.stringify(skema({ baza: baza || null, dataENdryshimit })).replace(
  /<\/script/gi,
  '<\\/script',
);

koka.push(`<script type="application/ld+json">${jsonLd}</script>`);

zevendeso(
  /<\/head>/,
  () => `${koka.map((rreshti) => `  ${rreshti}\n  `).join('')}</head>`,
  '</head>',
);

/* ── Faqja e gatshme brenda HTML-së ────────────────────────────────────── */

const statike = faqjaStatike();
zevendeso(
  /<div id="app"><\/div>/,
  () => `<div id="app">${statike}</div>`,
  '<div id="app"></div>',
);

writeFileSync(faqja, html, 'utf8');

/* ── robots.txt dhe sitemap.xml ────────────────────────────────────────── */

const robots = [
  '# Kujdestaria e barnatoreve — orari i kujdestarisë së barnatoreve',
  'User-agent: *',
  'Allow: /',
  '',
  ...(baza ? [`Sitemap: ${baza}/sitemap.xml`, ''] : []),
].join('\n');

writeFileSync(join(rrenja, 'robots.txt'), robots, 'utf8');

if (baza) {
  // Një faqe e vetme, por `lastmod` i thotë kërkuesit se përmbajtja u rifreskua —
  // pikërisht ajo që ndodh sa herë komuna publikon orarin e ri dhe faqja rindërtohet.
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baza}/</loc>
    <lastmod>${dataENdryshimit}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
  writeFileSync(join(rrenja, 'sitemap.xml'), sitemap, 'utf8');
}

const kb = (v) => `${(Buffer.byteLength(v, 'utf8') / 1024).toFixed(1)} kB`;
console.log(
  `index.html → përmbajtje e gatshme ${kb(statike)} · JSON-LD ${kb(jsonLd)} · ` +
    `robots.txt${baza ? ' · sitemap.xml' : ''}`,
);
