/**
 * Validim i lidhjeve të hartës.
 *
 * Lidhjet vendosen me dorë te `scripts/gjenero-orarin.mjs` dhe përfundojnë në një
 * atribut `href` që ndërtohet me varg teksti, prandaj kalojnë nga këtu: pranohen
 * vetëm `https:` dhe vetëm hostet e Google Maps. Kështu një `javascript:` ose një
 * lidhje e gabuar nuk shkon kurrë në faqe.
 *
 * Përdoret edhe nga skripta e gjenerimit (Node) edhe nga faqja, që rregulli të
 * jetë i njëjti në të dyja anët.
 */
export const HOSTE_TE_LEJUARA = [
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl',
  'goo.gl',
];

/** Hosti i një URL-je, ose `null` nëse vargu nuk është URL e vlefshme. */
export function hostiI(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Kthen lidhjen nëse është Google Maps mbi https, përndryshe `null`. */
export function lidhjeHarteEVlefshme(url) {
  if (!url) return null;
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:') return null;
  if (!HOSTE_TE_LEJUARA.includes(u.hostname.toLowerCase())) return null;
  return u.href;
}
