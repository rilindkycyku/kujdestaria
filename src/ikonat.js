/**
 * Ikonat e faqes si SVG inline.
 *
 * Emoji-t vizatohen nga fonti i sistemit, prandaj dalin me ngjyra e madhësi të
 * ndryshme në Android, iOS e Windows dhe nuk marrin ngjyrën e tekstit përreth.
 * SVG-ja inline nuk kërkon skedar të jashtëm (CSP-ja e faqes lejon vetëm
 * `'self'`), hyn brenda paketës dhe punon pa internet si gjithçka tjetër.
 */

const KORNIZA =
  'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';

const SHTIGJET = {
  harta: '<path d="M12 21.6S19 15.3 19 10.4a7 7 0 1 0-14 0c0 4.9 7 11.2 7 11.2Z"/><circle cx="12" cy="10.3" r="2.5"/>',
  telefoni:
    '<path d="M6.4 3h3.1l1.5 3.9-2 1.4a12.3 12.3 0 0 0 5.2 5.2l1.4-2L19.5 13v3.1a2 2 0 0 1-2.2 2A15.9 15.9 0 0 1 4.4 5.2 2 2 0 0 1 6.4 3Z"/>',
  ndaj: '<path d="M12 15.5V4m0 0 3.6 3.6M12 4 8.4 7.6"/><path d="M5 13.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4.5"/>',
  shto: '<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="4.4"/><path d="M12 8.4v7.2M8.4 12h7.2"/>',
  jashte: '<path d="M7.5 16.5l9-9M9.8 7.5h6.7v6.7"/>',
  ora: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.6V12l3 1.9"/>',
  nate: '<path d="M20 14.3A8.4 8.4 0 0 1 9.7 4a8.4 8.4 0 1 0 10.3 10.3Z"/>',
  dite: '<circle cx="12" cy="12" r="4.1"/><path d="M12 3v1.9M12 19.1V21M3 12h1.9M19.1 12H21M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>',
  info: '<circle cx="12" cy="12" r="8.4"/><path d="M12 11v5.2"/><path d="M12 7.9h.01"/>',
  njofto: '<rect x="3.4" y="5.6" width="17.2" height="12.8" rx="2.2"/><path d="M4.2 7l7.8 5.5L19.8 7"/>',
  shigjeta: '<path d="M6.5 9.75 12 15.25l5.5-5.5"/>',
};

/** `ikona('harta')` → SVG-ja që merr ngjyrën e tekstit ku vendoset. */
export function ikona(emri, klasa = 'ikona') {
  const shtegu = SHTIGJET[emri];
  if (!shtegu) return '';
  return `<svg class="${klasa}" ${KORNIZA}>${shtegu}</svg>`;
}

/**
 * Zemra e fundfaqjes. E mbushur, jo me vija si ikonat e tjera, dhe me
 * `aria-label` — pa të, lexuesi i ekranit do të thoshte „Bërë me nga Rilind".
 */
export function zemra() {
  return `
    <svg class="zemra" viewBox="0 0 24 24" role="img" aria-label="dashuri">
      <path d="M12 20.7l-1.6-1.45C5.6 14.9 2.7 12.25 2.7 8.95 2.7 6.25 4.85 4.1 7.55 4.1c1.55 0 3.03.72 3.99 1.86l.46.55.46-.55A5.15 5.15 0 0 1 16.45 4.1c2.7 0 4.85 2.15 4.85 4.85 0 3.3-2.9 5.95-7.7 10.3L12 20.7Z" />
    </svg>
  `;
}

/**
 * Shenja e faqes: kryqi i barnatores, i njëjti motiv si favicon-i dhe ikonat e
 * PWA-së. Ngjyrat vijnë nga CSS-i, prandaj ndryshon vetë me temën e sistemit.
 */
export function shenjaEFaqes() {
  return `
    <svg class="marka" viewBox="0 0 44 44" role="img" aria-label="Kujdestaria e barnatoreve">
      <rect class="marka__fusha" width="44" height="44" rx="12" />
      <path class="marka__kryqi" d="M18.6 10h6.8v8.6H34v6.8h-8.6V34h-6.8v-8.6H10v-6.8h8.6z" />
    </svg>
  `;
}
