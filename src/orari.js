import orari from './data/orari-2026.json';
import { lidhjeHarteEVlefshme } from './harta.js';
import { emriIMuajit, gjendjaEKujdestarise } from './koha.js';

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

/**
 * Sa net kujdestarie ka një barnatore brenda një cikli.
 * Flora, Rigoni dhe Rigoni-2 shfaqen dy herë në ciklin 10-ditor, prandaj kanë
 * dy net; të tjerat një.
 */
export function netNeCikel(emri) {
  return orari.rotacioni.filter((i) => i === emri).length;
}

/** A ka të paktën një barnatore lidhje harte? Nëse jo, seksioni i hartave fshihet. */
export function kaHarta() {
  return tëGjithaBarnatoret().some((b) => b.harta);
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

/**
 * Kush është kujdestar në këtë moment — gjendja e kohës nga
 * [`koha.js`](koha.js), plus rreshti i orarit që i takon atij nate.
 *
 * `dita` është `null` kur nata në fuqi bie jashtë periudhës së orarit; UI-ja e
 * përdor këtë për kartelën „Jashtë periudhës".
 */
export function kujdestariaTani(tani = new Date()) {
  const gjendja = gjendjaEKujdestarise(tani, orari.orari.kujdestaria);
  return { ...gjendja, dita: kujdestariaPer(gjendja.natenIsFilloi) };
}
