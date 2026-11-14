/**
 * Gjeneron `src/data/orari-2026.json` nga rotacioni 10-ditor i dokumentit zyrtar.
 *
 * Përdorimi:  node scripts/gjenero-orarin.mjs
 *
 * Kur komuna publikon orarin e ri, shtoje te DOKUMENTET (më i riu i fundit),
 * përditëso ROTACIONI e FUNDI nëse duhet, dhe ekzekuto skriptën përsëri.
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
// Deri ku e projektojmë rotacionin: tërë viti 2027, që faqja të mos mbetet bosh
// nëse orari i ri i komunës vonohet. Çdo datë jashtë DOKUMENTET mbetet „e projektuar".
const FUNDI = '2027-12-31';

/**
 * Dokumentet e publikuara, sipas radhës; i fundit është burimi kryesor i faqes.
 * Vetëm datat brenda `prej`–`deri` të njërit prej tyre janë `zyrtare` — pjesa
 * tjetër (p.sh. një hapësirë mes dy dokumenteve) është rotacion i llogaritur.
 */
const DOKUMENTET = [
  {
    titulli: 'Korrik – Gusht 2026',
    prej: '2026-07-01',
    deri: '2026-08-31',
    referenca: '03Nr. 500/01-15606/26',
    data: '2026-06-29',
    url: 'https://kacanik.rks-gov.net/wp-content/uploads/2026/06/Orari-Korrik-Gusht-2026.pdf',
  },
  {
    titulli: 'Nëntor – Dhjetor 2026',
    prej: '2026-11-01',
    deri: '2026-12-31',
    referenca: '03Nr. 104/02-29253/26',
    data: '2026-10-30',
    url: 'https://kacanik.rks-gov.net/wp-content/uploads/2026/11/Orari-i-kujdesatarise-se-barnatoreve-nentor-dhjetor-2026.pdf',
  },
];
const DOKUMENTI = DOKUMENTET.at(-1);
const eZyrtare = (data) => DOKUMENTET.some((d) => d.prej <= data && data <= d.deri);

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
  Dielli: {
    harta: 'https://maps.app.goo.gl/HLp6SPG7N5cZRzHe6?g_st=ac',
    adresa: 'BK Center',
    telefoni: '',
  },
  Flora: {
    harta: 'https://maps.app.goo.gl/1ws8yaCkQqyKtubH9?g_st=ac',
    adresa: 'BK Center',
    telefoni: '',
  },
  Liampharm: {
    harta: 'https://maps.app.goo.gl/ANpTDYwGMqL6iiJD6?g_st=ac',
    adresa: 'Afër BK Center',
    telefoni: '',
  },
  Riga: {
    harta: 'https://maps.app.goo.gl/s2oCV52ngBUD6dHM6?g_st=ac',
    adresa: 'Bulevardi Ismail Raka - Korza I',
    telefoni: '',
  },
  'Riga-2': {
    harta: 'https://maps.app.goo.gl/Xin4bv3N4aaWf3wg8?g_st=ac',
    adresa: 'Bob - përballë Viva Fresh Store',
    telefoni: '',
  },
  Rigoni: {
    harta: 'https://maps.app.goo.gl/jXBwAbQb8n6U2f8z9',
    adresa: 'BK Center',
    telefoni: '',
  },
  'Rigoni-2': {
    harta: 'https://maps.app.goo.gl/jXBwAbQb8n6U2f8z9',
    adresa: 'BK Center',
    telefoni: '',
  },
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

/**
 * Sezoni i një date sipas rregullores: secila periudhë përfundon me të dielën e
 * saj të fundit (Tetori për verën, Marsi për dimrin), dhe tjetra nis të nesërmen.
 */
function sezoniI(d) {
  const viti = d.getUTCFullYear();
  return eDielaEFundit(viti, 3) < d && d <= eDielaEFundit(viti, 10) ? 'veror' : 'dimeror';
}

const kujdestaria = [];
for (let d = dt(FILLIMI), i = 0; d <= dt(FUNDI); d = shtoDite(d, 1), i++) {
  const pozita = i % ROTACIONI.length;
  kujdestaria.push({
    data: iso(d),
    dita: DITET[d.getUTCDay()],
    barnatorja: ROTACIONI[pozita],
    pozitaNeCikel: pozita + 1,
    sezoni: sezoniI(d),
    // Nata që fillon këtë datë në ora 22:00 dhe mbaron në ora 08:00 të nesërmen.
    kujdestaria: { ...ORARI_I_KUJDESTARISE, mbaronMe: iso(shtoDite(d, 1)) },
    zyrtare: eZyrtare(iso(d)),
  });
}

const dataShqip = (s) => s.split('-').reverse().join('.');

/** Periudhat e njëpasnjëshme të një sezoni brenda orarit, si `[{ prej, deri }]`. */
const periudhatESezonit = (sezoni) => {
  const periudhat = [];
  kujdestaria.forEach((dita, i) => {
    if (dita.sezoni !== sezoni) return;
    if (kujdestaria[i - 1]?.sezoni === sezoni) periudhat.at(-1).deri = dita.data;
    else periudhat.push({ prej: dita.data, deri: dita.data });
  });
  return periudhat;
};

/** Hapësirat pa dokument, si `[{ prej, deri }]` — ato që faqja i shënon „e projektuar". */
const projektuara = [];
for (const dita of kujdestaria) {
  if (dita.zyrtare) continue;
  const fundi = projektuara.at(-1);
  if (fundi && iso(shtoDite(dt(fundi.deri), 1)) === dita.data) fundi.deri = dita.data;
  else projektuara.push({ prej: dita.data, deri: dita.data });
}
const listaShqip = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} dhe ${a.at(-1)}`);
const periudhaShqip = ({ prej, deri }) => `${dataShqip(prej)} – ${dataShqip(deri)}`;

const doc = {
  titulli: 'Orari i kujdestarisë së barnatoreve — Komuna e Kaçanikut',
  komuna: 'Kaçanik',
  komunaGjinore: 'Kaçanikut',
  institucioni: 'Drejtoria për Shëndetësi dhe Mirëqenie Sociale',
  referenca: DOKUMENTI.referenca,
  dataEDokumentit: DOKUMENTI.data,
  nenshkroi: {
    emri: 'Lumnije Selmanaj – Demnika',
    pozita: 'Drejtoresha e DSHMS-së',
  },
  burimet: {
    dokumenti: DOKUMENTI.url,
    shpalljet: 'https://kacanik.rks-gov.net/shpalljet/',
  },
  periudha: {
    prej: FILLIMI,
    deri: FUNDI,
    zyrtarePrej: DOKUMENTI.prej,
    zyrtareDeri: DOKUMENTI.deri,
    titulliZyrtar: DOKUMENTI.titulli,
  },
  dokumentet: DOKUMENTET,
  projeksioni: {
    periudhat: projektuara,
    pershkrimi: listaShqip(projektuara.map(periudhaShqip)),
    shpjegimi:
      `Dokumentet zyrtare mbulojnë ${listaShqip(DOKUMENTET.map((d) => d.titulli))}. ` +
      `Datat ${listaShqip(projektuara.map(periudhaShqip))} nuk mbulohen nga asnjë dokument i ` +
      'publikuar: janë vazhdim i llogaritur i të njëjtit rotacion 10-ditor dhe nuk janë ' +
      'konfirmuar nga komuna. Kur komuna publikon orarin e tyre, ai ka përparësi.',
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
      periudhat: periudhatESezonit('veror'),
    },
    dimeror: {
      pershkrimi:
        'Fillon nga e diela e fundit e muajit Tetor dhe përfundon në të dielën e fundit të muajit Mars. ' +
        'Sipas rregullores orari bazë është 08:00–20:00, por me vendimin 01Nr.104/02-30047/22 ' +
        'të Kryetarit të komunës është zgjatur në 08:00–22:00.',
      prej: '08:00',
      deri: '22:00',
      periudhat: periudhatESezonit('dimeror'),
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
