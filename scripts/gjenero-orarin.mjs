/**
 * Gjeneron `src/data/orari-2026.json` nga rotacioni 10-ditor i dokumentit zyrtar.
 *
 * Përdorimi:  node scripts/gjenero-orarin.mjs
 *
 * Kur komuna publikon orarin e ri, përditëso konstantet më poshtë (ROTACIONI,
 * FILLIMI, FUNDI_ZYRTAR, FUNDI) dhe ekzekuto skriptën përsëri.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOSTE_TE_LEJUARA, hostiI } from '../src/harta.js';

// Rotacioni 10-ditor, ashtu si është shtypur në dokumentin zyrtar (kolonat majtas-djathtas).
const ROTACIONI = [
  'Flora',
  'Liampharm',
  'Rigoni-2',
  'Rigoni',
  'Dielli',
  'Rigoni-2',
  'Rigoni',
  'Riga',
  'Riga-2',
  'Flora',
];

const FILLIMI = '2026-07-01';
const FUNDI_ZYRTAR = '2026-08-31'; // deri ku e mbulon dokumenti i publikuar
const FUNDI = '2026-12-31'; // deri ku e projektojmë rotacionin

// Orari i rregullt vlen për të gjitha barnatoret; kujdestaria fillon kur ai mbaron
// dhe vazhdon tërë natën deri në mëngjes.
const ORARI_I_RREGULLT = { prej: '08:00', deri: '22:00' };
const ORARI_I_KUJDESTARISE = { prej: '22:00', deri: '08:00' };

/**
 * Të dhënat e kontaktit për çdo barnatore. Vetëm `emri` është i detyrueshëm —
 * fushat e zbrazëta thjesht nuk shfaqen në faqe.
 *
 * `harta`: lidhje Google Maps. Pranohen vetëm `google.com/maps`, `maps.google.com`,
 * `maps.app.goo.gl` dhe `goo.gl/maps` — lidhjet e tjera nuk shfaqen.
 * `telefoni`: në formatin ndërkombëtar, p.sh. `+383 44 123 456`.
 */
const BARNATORET = {
  Dielli: { harta: '', adresa: '', telefoni: '' },
  Flora: { harta: '', adresa: '', telefoni: '' },
  Liampharm: { harta: '', adresa: '', telefoni: '' },
  Riga: { harta: '', adresa: '', telefoni: '' },
  'Riga-2': { harta: '', adresa: '', telefoni: '' },
  Rigoni: { harta: '', adresa: '', telefoni: '' },
  'Rigoni-2': { harta: '', adresa: '', telefoni: '' },
};

const DITET = [
  'E diel',
  'E hënë',
  'E martë',
  'E mërkurë',
  'E enjte',
  'E premte',
  'E shtunë',
];

/** Data si UTC, që ndryshimi i orës verore të mos e zhvendosë numërimin e ditëve. */
const dt = (iso) => new Date(`${iso}T00:00:00Z`);
const iso = (d) => d.toISOString().slice(0, 10);
const shtoDite = (d, n) => new Date(d.getTime() + n * 86400000);

/** E diela e fundit e një muaji, p.sh. kufiri veror/dimëror sipas rregullores. */
function eDielaEFundit(viti, muaji) {
  const fundi = new Date(Date.UTC(viti, muaji, 0)); // dita 0 e muajit tjetër = dita e fundit
  return shtoDite(fundi, -fundi.getUTCDay());
}

const fundiIVeres = eDielaEFundit(2026, 10); // e diela e fundit e Tetorit

const kujdestaria = [];
for (let d = dt(FILLIMI), i = 0; d <= dt(FUNDI); d = shtoDite(d, 1), i++) {
  const pozita = i % ROTACIONI.length;
  kujdestaria.push({
    data: iso(d),
    dita: DITET[d.getUTCDay()],
    barnatorja: ROTACIONI[pozita],
    pozitaNeCikel: pozita + 1,
    sezoni: d <= fundiIVeres ? 'veror' : 'dimeror',
    // Nata që fillon këtë datë në ora 22:00 dhe mbaron në ora 08:00 të nesërmen.
    kujdestaria: { ...ORARI_I_KUJDESTARISE, mbaronMe: iso(shtoDite(d, 1)) },
    zyrtare: iso(d) <= FUNDI_ZYRTAR,
  });
}

const dataShqip = (s) => s.split('-').reverse().join('.');

const doc = {
  titulli: 'Orari i kujdestarisë së barnatoreve — Komuna e Kaçanikut',
  komuna: 'Kaçanik',
  komunaGjinore: 'Kaçanikut',
  institucioni: 'Drejtoria për Shëndetësi dhe Mirëqenie Sociale',
  referenca: '03Nr. 500/01-15606/26',
  dataEDokumentit: '2026-06-29',
  nenshkroi: {
    emri: 'Lumnije Selmanaj – Demnika',
    pozita: 'Drejtoresha e DSHMS-së',
  },
  burimet: {
    dokumenti:
      'https://kacanik.rks-gov.net/wp-content/uploads/2026/06/Orari-Korrik-Gusht-2026.pdf',
    shpalljet: 'https://kacanik.rks-gov.net/shpalljet/',
  },
  periudha: {
    prej: FILLIMI,
    deri: FUNDI,
    zyrtareDeri: FUNDI_ZYRTAR,
    titulliZyrtar: 'Korrik – Gusht 2026',
  },
  projeksioni: {
    shpjegimi:
      `Dokumenti zyrtar mbulon vetëm Korrik–Gusht 2026. Datat pas ${dataShqip(FUNDI_ZYRTAR)} ` +
      'janë vazhdim i llogaritur i të njëjtit rotacion 10-ditor dhe nuk janë konfirmuar nga ' +
      'komuna. Kur komuna publikon orarin e ri, ai ka përparësi.',
    gjatesiaECiklit: ROTACIONI.length,
  },
  bazaLigjore: [
    'Rregullorja Komunale 01Nr.05-16-2609/15 e datës 30.01.2015',
    'Vendimi i Kryetarit të komunës 01Nr.104/02-30047/22 për zgjatjen e orarit të punës për barnatoret farmaceutike',
  ],
  orari: {
    iRregullt: {
      ...ORARI_I_RREGULLT,
      shpjegimi:
        'Orari i rregullt i punës, i njëjtë për të gjitha barnatoret. Gjatë tij nuk ka barnatore të veçantë kujdestare.',
    },
    kujdestaria: {
      ...ORARI_I_KUJDESTARISE,
      shpjegimi:
        'Pas orarit të rregullt, barnatorja kujdestare e asaj date qëndron e hapur tërë natën, ' +
        'deri në ora 08:00 të nesërmen.',
    },
  },
  sezonet: {
    veror: {
      pershkrimi:
        'Fillon nga e diela e fundit e muajit Mars dhe përfundon me të dielën e fundit të muajit Tetor.',
      prej: '08:00',
      deri: '22:00',
      mbaron: iso(fundiIVeres),
    },
    dimeror: {
      pershkrimi:
        'Fillon nga e diela e fundit e muajit Tetor dhe përfundon në të dielën e fundit të muajit Mars. ' +
        'Sipas rregullores orari bazë është 08:00–20:00, por me vendimin 01Nr.104/02-30047/22 ' +
        'të Kryetarit të komunës është zgjatur në 08:00–22:00.',
      prej: '08:00',
      deri: '22:00',
      fillon: iso(shtoDite(fundiIVeres, 1)),
      orariBazeSipasRregullores: { prej: '08:00', deri: '20:00' },
    },
  },
  njoftohen: [
    'Të gjitha barnatoret kujdestare',
    'QKMF në Kaçanik',
    'Stacioni policor – Kaçanik',
    'Inspektorati i Komunës',
    'Arkivi',
  ],
  barnatoret: [...new Set(ROTACIONI)]
    .sort((a, b) => a.localeCompare(b, 'sq'))
    .map((emri) => ({ emri, ...(BARNATORET[emri] ?? { harta: '', adresa: '', telefoni: '' }) })),
  rotacioni: ROTACIONI,
  kujdestaria,
};

// Kontrolle që një gabim shtypi te BARNATORET të mos kalojë në heshtje.
for (const emri of new Set(ROTACIONI)) {
  if (!BARNATORET[emri]) {
    console.warn(`kujdes: "${emri}" nuk ka zë te BARNATORET — do të dalë pa hartë e telefon.`);
  }
}
for (const b of doc.barnatoret) {
  if (b.harta && !HOSTE_TE_LEJUARA.some((h) => hostiI(b.harta) === h)) {
    console.warn(`kujdes: lidhja e hartës e "${b.emri}" nuk është Google Maps — nuk do të shfaqet.`);
  }
}

const rruga = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
  'orari-2026.json',
);
writeFileSync(rruga, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');

const zyrtare = kujdestaria.filter((d) => d.zyrtare).length;
console.log(
  `${rruga}\n` +
    `gjithsej: ${kujdestaria.length} ditë | zyrtare: ${zyrtare} | të projektuara: ${kujdestaria.length - zyrtare}\n` +
    `${kujdestaria[0].data} (${kujdestaria[0].barnatorja}) → ${kujdestaria.at(-1).data} (${kujdestaria.at(-1).barnatorja})`,
);
