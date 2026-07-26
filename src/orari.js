import orari from './data/orari-2026.json';
import { lidhjeHarteEVlefshme } from './harta.js';

export { orari };

const SIPAS_EMRIT = new Map(orari.barnatoret.map((b) => [b.emri, b]));

/**
 * Kontaktet e një barnatore, me lidhjen e hartës të validuar.
 * Fushat e zbrazëta kthehen si `null`, që UI-ja të vendosë vetëm çka ka.
 */
export function barnatorja(emri) {
  const b = SIPAS_EMRIT.get(emri);
  return {
    emri,
    harta: lidhjeHarteEVlefshme(b?.harta),
    adresa: b?.adresa || null,
    telefoni: b?.telefoni || null,
  };
}

/** Të gjitha barnatoret me kontaktet e validuara, sipas alfabetit. */
export function tëGjithaBarnatoret() {
  return orari.barnatoret.map((b) => barnatorja(b.emri));
}

/** A ka të paktën një barnatore lidhje harte? Nëse jo, seksioni i hartave fshihet. */
export function kaHarta() {
  return tëGjithaBarnatoret().some((b) => b.harta);
}

/** Data e sotme si varg `YYYY-MM-DD`, sipas orës lokale (jo UTC). */
export function dataSot(date = new Date()) {
  const v = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${v}-${m}-${d}`;
}

/** Rreshti i kujdestarisë për një datë, ose `null` nëse data është jashtë periudhës. */
export function kujdestariaPer(data) {
  return orari.kujdestaria.find((dita) => dita.data === data) ?? null;
}

/** Kujdestaritë e ardhshme pas një date, maksimumi `sa` rreshta. */
export function tëArdhshmet(data, sa = 5) {
  return orari.kujdestaria.filter((dita) => dita.data > data).slice(0, sa);
}

/**
 * Grupon kujdestaritë sipas muajit kalendarik, në rendin që shfaqen.
 * Kthen `[{ celes: '2026-07', emri: 'Korrik 2026', ditet: [...] }, ...]`
 */
export function sipasMuajve() {
  const muajt = new Map();
  for (const dita of orari.kujdestaria) {
    const celes = dita.data.slice(0, 7);
    if (!muajt.has(celes)) {
      muajt.set(celes, { celes, emri: emriIMuajit(celes), ditet: [] });
    }
    muajt.get(celes).ditet.push(dita);
  }
  return [...muajt.values()];
}

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

/** `'2026-07'` → `'Korrik 2026'` */
export function emriIMuajit(celes) {
  const [viti, muaji] = celes.split('-');
  return `${EMRAT_E_MUAJVE[Number(muaji) - 1]} ${viti}`;
}

/** `'2026-07-01'` → `'01.07.2026'`, formati i përdorur në dokumentin zyrtar. */
export function dataShqip(data) {
  const [viti, muaji, dita] = data.split('-');
  return `${dita}.${muaji}.${viti}`;
}

/** `'2026-07'` → `'Korrik'` (pa vit, për tituj brenda të njëjtit vit). */
export function emriIMuajitShkurt(celes) {
  return EMRAT_E_MUAJVE[Number(celes.split('-')[1]) - 1];
}

/** `'2026-07-01'` → `'01.07'`, pa vit, për etiketa të shkurtra. */
export function dataShkurt(data) {
  const [, muaji, dita] = data.split('-');
  return `${dita}.${muaji}`;
}

/** Numri i ditëve nga `nga` deri te `deri` (të dyja si `YYYY-MM-DD`). */
export function ditetMes(nga, deri) {
  const ms = Date.parse(`${deri}T00:00:00Z`) - Date.parse(`${nga}T00:00:00Z`);
  return Math.round(ms / 86400000);
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

/**
 * Kush është kujdestar në këtë moment.
 *
 * Kujdestaria e një date fillon në ora 22:00 të asaj date dhe mbaron në ora 08:00
 * të nesërmen. Prandaj pas mesnate ende vlen kujdestarja e datës së djeshme —
 * pikërisht arsyeja pse nuk mjafton `kujdestariaPer(dataSot())`.
 *
 * Kthen `{ faza, dita, natenIsFilloi }`:
 *  - `faza: 'nate'` — jemi brenda kujdestarisë; `dita` është kujdestarja e hapur tani
 *  - `faza: 'dite'` — orari i rregullt; `dita` është kujdestarja e natës që vjen
 */
export function kujdestariaTani(tani = new Date()) {
  const fillonNata = neMinuta(orari.orari.kujdestaria.prej);
  const mbaronNata = neMinuta(orari.orari.kujdestaria.deri);
  const minutaTani = tani.getHours() * 60 + tani.getMinutes();
  const sot = dataSot(tani);

  // Pas mesnate deri në mëngjes: nata e nisur dje.
  if (minutaTani < mbaronNata) {
    const dje = zhvendosDite(sot, -1);
    return { faza: 'nate', dita: kujdestariaPer(dje), natenIsFilloi: dje };
  }

  // Prej ores 22:00 deri në mesnatë: nata e nisur sot.
  if (minutaTani >= fillonNata) {
    return { faza: 'nate', dita: kujdestariaPer(sot), natenIsFilloi: sot };
  }

  // Orari i rregullt: të gjitha hapur, kujdestaria e sonte ende s'ka filluar.
  return { faza: 'dite', dita: kujdestariaPer(sot), natenIsFilloi: sot };
}
