/**
 * Data, ora dhe gjendja e kujdestarisë — pa varësi nga të dhënat.
 *
 * Kjo pjesë është e ndarë nga [`orari.js`](orari.js) sepse është pjesa që gabon
 * pa u dukur: nata kalon mesnatën, prandaj pas mesnate kujdestare është ende
 * barnatorja e datës së djeshme. Një gabim i tillë nuk rrëzon faqen — vetëm
 * dërgon dikë te barnatorja e gabuar në ora 02:00. Këtu nuk ka `import` të
 * JSON-it, prandaj `node --test` e ekzekuton drejtpërdrejt, pa bundler.
 */

const EMRAT_E_MUAJVE = [
  'Janar',
  'Shkurt',
  'Mars',
  'Prill',
  'Maj',
  'Qershor',
  'Korrik',
  'Gusht',
  'Shtator',
  'Tetor',
  'Nëntor',
  'Dhjetor',
];

/** Data e sotme si varg `YYYY-MM-DD`, sipas orës lokale (jo UTC). */
export function dataSot(date = new Date()) {
  const v = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${v}-${m}-${d}`;
}

/** Zhvendos një datë `YYYY-MM-DD` me `n` ditë, pa u ndikuar nga ora verore. */
export function zhvendosDite(data, n) {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** `'22:00'` → `1320` (minuta nga mesnata). */
export function neMinuta(ora) {
  const [o, m] = ora.split(':').map(Number);
  return o * 60 + m;
}

/** `'2026-07'` → `'Korrik 2026'` */
export function emriIMuajit(celes) {
  const [viti, muaji] = celes.split('-');
  return `${EMRAT_E_MUAJVE[Number(muaji) - 1]} ${viti}`;
}

/** `'2026-07'` → `'Korrik'` (pa vit, për tituj brenda të njëjtit vit). */
export function emriIMuajitShkurt(celes) {
  return EMRAT_E_MUAJVE[Number(celes.split('-')[1]) - 1];
}

/** `'2026-07-01'` → `'01.07.2026'`, formati i përdorur në dokumentin zyrtar. */
export function dataShqip(data) {
  const [viti, muaji, dita] = data.split('-');
  return `${dita}.${muaji}.${viti}`;
}

/** `'2026-07-01'` → `'01.07'`, pa vit, për etiketa të shkurtra. */
export function dataShkurt(data) {
  const [, muaji, dita] = data.split('-');
  return `${dita}.${muaji}`;
}

/** `'E mërkurë'` → `'Mër'`, që dita të hyjë në kartelat e ngushta. */
export function ditaShkurt(dita) {
  const emri = dita.replace(/^E\s+/i, '');
  return emri.charAt(0).toUpperCase() + emri.slice(1, 3);
}

/** `97` → `'1 h 37 min'`. Ora e vetme dhe minutat e vetme nuk shkruhen kot. */
export function kohaShkurt(minuta) {
  const ore = Math.floor(minuta / 60);
  const mbetja = minuta % 60;
  if (ore === 0) return `${mbetja} min`;
  if (mbetja === 0) return `${ore} h`;
  return `${ore} h ${mbetja} min`;
}

/**
 * Në çfarë faze është kujdestaria në këtë moment, dhe cila natë vlen.
 *
 * Kujdestaria e një date fillon në ora `dritarja.prej` të asaj date dhe mbaron
 * në `dritarja.deri` të nesërmen. Prandaj dita ndahet në tri pjesë:
 *
 * ```
 *  00:00 ──────── 08:00 ──────────────── 22:00 ──────── 24:00
 *   nata e nisur dje │  orari i rregullt   │ nata e nisur sot
 * ```
 *
 * Kthen `{ faza, natenIsFilloi, mbeten, kaluar, gjatesia }`, të gjitha në minuta:
 *  - `faza: 'nate'` — brenda kujdestarisë; `mbeten` deri sa të mbarojë
 *  - `faza: 'dite'` — orari i rregullt; `mbeten` deri sa të fillojë kujdestaria
 *  - `kaluar` / `gjatesia` — sa e ka kaluar nata rrugën (0 gjatë ditës)
 */
export function gjendjaEKujdestarise(tani, dritarja) {
  const fillon = neMinuta(dritarja.prej);
  const mbaron = neMinuta(dritarja.deri);
  // Nata kalon mesnatën, prandaj gjatësia matet në dy pjesë.
  const gjatesia = 24 * 60 - fillon + mbaron;
  const minutaTani = tani.getHours() * 60 + tani.getMinutes();
  const sot = dataSot(tani);

  // Pas mesnate deri në mëngjes: nata e nisur dje.
  if (minutaTani < mbaron) {
    return {
      faza: 'nate',
      natenIsFilloi: zhvendosDite(sot, -1),
      mbeten: mbaron - minutaTani,
      kaluar: 24 * 60 - fillon + minutaTani,
      gjatesia,
    };
  }

  // Prej `fillon` deri në mesnatë: nata e nisur sot.
  if (minutaTani >= fillon) {
    return {
      faza: 'nate',
      natenIsFilloi: sot,
      mbeten: fillon + gjatesia - minutaTani,
      kaluar: minutaTani - fillon,
      gjatesia,
    };
  }

  // Orari i rregullt: të gjitha hapur, kujdestaria e sonte ende s'ka filluar.
  return {
    faza: 'dite',
    natenIsFilloi: sot,
    mbeten: fillon - minutaTani,
    kaluar: 0,
    gjatesia,
  };
}
