/**
 * Tema e faqes: sipas sistemit (parazgjedhje), e çelët ose e errët.
 *
 * Kjo skriptë nuk hyn te paketa e Vite-s dhe ngarkohet bllokuese te `<head>`-i me
 * qëllim: zgjedhja duhet të vlejë para vizatimit të parë. Po ta bënte `main.js` —
 * modul, pra i shtyrë — faqja do të ndizej një çast me temën e sistemit, dhe për
 * këdo që e ka zgjedhur terrin ajo ndezje është një e bardhë në ora 02:00.
 *
 * Prandaj e gjithë sjellja e temës rri këtu: leximi, ruajtja, butonat e kreut dhe
 * ngjyra e shiritit të shfletuesit. `style.css` e lexon zgjedhjen te `data-tema` i
 * `<html>`; pa zgjedhje atributi mungon dhe vendos `prefers-color-scheme`, si më parë.
 * Pa JavaScript humbet vetëm zgjedhja me dorë — tema e sistemit punon njësoj.
 */
(function () {
  'use strict';

  var ÇELESI = 'kujdestaria:tema';
  var ZGJEDHJET = ['sistemi', 'drite', 'terr'];
  var rrenja = document.documentElement;

  /**
   * Të dy `<meta name="theme-color">` e `<head>`-it, me `media`-n e tyre fillestare.
   * Lexohen tani, para se ajo `media` të preket, që zgjedhja „sipas sistemit" të
   * kthehet e plotë. Skripta rri pas tyre te `<head>`-i — përndryshe s'do të ishin
   * ende të analizuara dhe shiriti i shfletuesit thjesht nuk do të ndiqte temën.
   */
  var shiritat = [];
  var metat = document.head.querySelectorAll('meta[name="theme-color"]');
  for (var i = 0; i < metat.length; i++) {
    var media = metat[i].getAttribute('media') || '';
    shiritat.push({
      meta: metat[i],
      media: media,
      tema: media.indexOf('dark') === -1 ? 'drite' : 'terr',
    });
  }

  /** Zgjedhja e ruajtur, ose `'sistemi'`. */
  function lexo() {
    try {
      var e = localStorage.getItem(ÇELESI);
      return ZGJEDHJET.indexOf(e) > 0 ? e : 'sistemi';
    } catch (gabimi) {
      // Modaliteti privat i disa shfletuesve e ndalon leximin. Pa zgjedhje: sistemi.
      return 'sistemi';
    }
  }

  function ruaj(tema) {
    try {
      if (tema === 'sistemi') localStorage.removeItem(ÇELESI);
      else localStorage.setItem(ÇELESI, tema);
    } catch (gabimi) {
      // Pa ruajtje, zgjedhja vlen vetëm për këtë vizitë — më mirë se asgjë.
    }
  }

  /**
   * Ngjyra e shiritit të shfletuesit. Kur përdoruesi zgjedh vetë, `media`-ja e
   * `<meta>`-s që duhet bëhet `all` dhe e tjetra `not all`, që shfletuesi të mos
   * mbetet te tema e sistemit mbi një faqe të temës tjetër.
   */
  function ngjyraEShiritit(tema) {
    for (var i = 0; i < shiritat.length; i++) {
      var shiriti = shiritat[i];
      if (tema === 'sistemi') shiriti.meta.setAttribute('media', shiriti.media);
      else shiriti.meta.setAttribute('media', shiriti.tema === tema ? 'all' : 'not all');
    }
  }

  function vendos(tema) {
    if (tema === 'sistemi') rrenja.removeAttribute('data-tema');
    else rrenja.setAttribute('data-tema', tema);
    ngjyraEShiritit(tema);
  }

  /** Butoni i shtypur dallohet nga `aria-pressed`, si te shiriti i muajve. */
  function shenoButonat(tema) {
    var butonat = document.querySelectorAll('[data-tema-zgjedh]');
    for (var i = 0; i < butonat.length; i++) {
      butonat[i].setAttribute(
        'aria-pressed',
        String(butonat[i].getAttribute('data-tema-zgjedh') === tema),
      );
    }
  }

  vendos(lexo());

  // Butonat vizatohen nga `faqja.js`, pra nuk ekzistojnë ende kur kjo skriptë niset;
  // deri te `DOMContentLoaded` `main.js` e ka vendosur skeletin.
  document.addEventListener('DOMContentLoaded', function () {
    shenoButonat(lexo());
  });

  document.addEventListener('click', function (ngjarja) {
    var buton = ngjarja.target.closest && ngjarja.target.closest('[data-tema-zgjedh]');
    if (!buton) return;
    var tema = buton.getAttribute('data-tema-zgjedh');
    if (ZGJEDHJET.indexOf(tema) === -1) return;
    ruaj(tema);
    vendos(tema);
    shenoButonat(tema);
  });
})();
