/**
 * Veprimet e faqes: ndarja, instalimi në ekranin kryesor dhe regjistrimi i
 * service worker-it. Të gjitha janë opsionale — nëse shfletuesi nuk i mbështet,
 * butonat thjesht nuk shfaqen.
 */

/** Ngjarja `beforeinstallprompt`, e ruajtur derisa përdoruesi të shtypë butonin. */
let ftesaEInstalimit = null;

/** Thirret kur diçka ndryshon dhe faqja duhet rivizatuar. */
let njofto = () => {};

export function vendosNjoftuesin(fn) {
  njofto = fn;
}

export function eshteIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS paraqitet si Mac; e dallon prej prekjes.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** Cilat udhëzime duhen kur shfletuesi nuk e hap vetë ftesën: `'ios' | 'android' | 'kompjuter'`. */
export function platformaEInstalimit() {
  if (eshteIOS()) return 'ios';
  if (/Android/.test(navigator.userAgent)) return 'android';
  return 'kompjuter';
}

/** A po ekzekutohet faqja tashmë si aplikacion i instaluar? */
export function eshteEInstaluar() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // Safari në iOS nuk e mbështet display-mode, ka të vetën.
    navigator.standalone === true
  );
}

/**
 * A duhet shfaqur butoni i instalimit? Kudo veç kur faqja është tashmë e
 * instaluar.
 *
 * Më parë butoni varej nga `beforeinstallprompt`, prandaj në Safari të
 * kompjuterit, në Firefox dhe në Chrome-in që ende nuk e ka nisur ngjarjen nuk
 * shfaqej fare — dhe puna pa internet, që është arsyeja kryesore e kësaj faqeje,
 * mbetej e pazbuluar. Tani butoni është gjithnjë atje: kur shfletuesi e mbështet
 * ftesën, e hap atë; përndryshe tregon udhëzimet e platformës.
 */
export function mundTëInstalohet() {
  return !eshteEInstaluar();
}

/** `true` nëse duhen treguar udhëzimet me dorë në vend të ftesës automatike. */
export function kërkonUdhëzime() {
  return !ftesaEInstalimit;
}

/** Hap ftesën e instalimit. Kthen `true` nëse përdoruesi e pranoi. */
export async function instalo() {
  if (!ftesaEInstalimit) return false;
  ftesaEInstalimit.prompt();
  const { outcome } = await ftesaEInstalimit.userChoice;
  // Ngjarja vlen vetëm një herë.
  ftesaEInstalimit = null;
  njofto();
  return outcome === 'accepted';
}

export function mbështetetNdarja() {
  return Boolean(navigator.share) || Boolean(navigator.clipboard?.writeText);
}

/**
 * Ndan tekstin me aplikacionet e sistemit; nëse s'ka `navigator.share`, e kopjon
 * lidhjen. Kthen `'ndare' | 'kopjuar' | 'anuluar' | 'deshtoi'` që UI-ja të thotë
 * saktësisht çka ndodhi.
 */
export async function ndaj({ titulli, teksti, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title: titulli, text: teksti, url });
      return 'ndare';
    } catch (gabimi) {
      // Anulimi nga përdoruesi nuk është dështim.
      if (gabimi?.name === 'AbortError') return 'anuluar';
      // Disa shfletues e refuzojnë share-in; provojmë kopjimin.
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(`${teksti}\n${url}`);
      return 'kopjuar';
    } catch {
      return 'deshtoi';
    }
  }

  return 'deshtoi';
}

/** Regjistron service worker-in, që faqja të punojë edhe pa internet. */
export function regjistroServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // Service worker-at kërkojnë https (ose localhost gjatë zhvillimit).
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Pa service worker faqja punon njësoj, vetëm pa mbështetje offline.
    });
  });
}

window.addEventListener('beforeinstallprompt', (event) => {
  // Ndalon shiritin e parazgjedhur, që ftesa të dalë kur shtypet butoni ynë.
  event.preventDefault();
  ftesaEInstalimit = event;
  njofto();
});

window.addEventListener('appinstalled', () => {
  ftesaEInstalimit = null;
  njofto();
});
