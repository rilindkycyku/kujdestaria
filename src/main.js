import './style.css';
import { inject } from '@vercel/analytics';
import { orari, barnatorja, kujdestariaTani, sipasMuajve } from './orari.js';
import { dataSot, dataShkurt, dataShqip, kohaShkurt } from './koha.js';
import { ikona } from './ikonat.js';
import {
  TITULLI,
  ardhshmet,
  butonatEMuajve,
  fundfaqja,
  kreu,
  njoftimiIProjeksionit,
  seksioniIBarnatoreve,
  seksioniIPyetjeve,
  shpjegimiIOrarit,
  sig,
  tabelaEMuajit,
  tabelatEMuajit,
} from './faqja.js';
import {
  instalo,
  kërkonUdhëzime,
  mbështetetNdarja,
  mundTëInstalohet,
  ndaj,
  platformaEInstalimit,
  regjistroServiceWorker,
  vendosNjoftuesin,
} from './veprimet.js';

const app = document.querySelector('#app');
const muajt = sipasMuajve();
const { iRregullt, kujdestaria: orariINates } = orari.orari;

/** Muaji i shfaqur në tabelë; ndryshohet nga butonat e muajve. */
let muajiAktiv = null;

/*
 * A ka ekrani gjerësi sa për dy gjysma muaji krah për krah.
 *
 * Kufiri është 85rem e jo 62rem: dy gjysma kërkojnë gjerësi të vërtetë, dhe nën
 * të ato do të rrëshqisnin secila brenda vetes — dy tabela që rrëshqasin në vend
 * të njërës. I njëjti numër si te CSS-ja, dhe kjo është e vetmja kopje e tij te JS-ja:
 * gjerësinë e pyet `main.js` sepse `faqja.js` nuk e njeh ekranin (rregulli 2).
 * Ndërrimi i gjendjes rivizaton — përndryshe një dritare e zgjeruar do ta mbante
 * tabelën një shtyllë derisa të kalonte minuta.
 */
const iGjere = window.matchMedia('(min-width: 85rem)');

/** Mesazh i shkurtër pas një veprimi, p.sh. „Lidhja u kopjua". */
let mesazhi = null;
let afatiIMesazhit = null;

/** Udhëzimet me dorë shfaqen vetëm pasi shtypet butoni i instalimit. */
let udhëzimetHapur = false;

/**
 * Si instalohet faqja kur shfletuesi nuk hap ftesë vetë. Emrat e menyve mbeten
 * në anglisht sepse ashtu shkruhen edhe në shfletuesin e përkthyer në shqip.
 */
const UDHEZIMET = {
  ios: `Në iPhone: shtyp <strong>Share</strong> në shiritin e Safari-t, pastaj
        <strong>Add to Home Screen</strong>.`,
  android: `Në Android: hap menynë e shfletuesit (⋮), pastaj
            <strong>Install app</strong> ose <strong>Add to Home screen</strong>.`,
  kompjuter: `Në kompjuter: shtyp ikonën e instalimit në shiritin e adresës, ose menynë
              (⋮) → <strong>Install</strong>. Chrome-i dhe Edge-i e mbështetin;
              Firefox-i jo, por faqja punon njësoj edhe pa instalim.`,
};

/** Skeleti vendoset një herë; pastaj përditësohen vetëm pjesët që ndryshojnë. */
let ndertuar = false;

function trego(tekst) {
  mesazhi = tekst;
  clearTimeout(afatiIMesazhit);
  afatiIMesazhit = setTimeout(() => {
    mesazhi = null;
    vizato();
  }, 3000);
  vizato();
}

/**
 * Vendos HTML-në e një pjese të faqes, vetëm nëse ka ndryshuar vërtet.
 *
 * Faqja rivizatohet çdo minutë për numërimin e kohës. Nëse do të shkruhej
 * `app.innerHTML` i tërë, çdo minutë do të humbte rrëshqitja e tabelës, gjendja
 * e `<details>`-it dhe fokusi i tastierës. Kështu, në një minutë të zakonshme
 * ndryshon vetëm kartela e gjendjes.
 */
const iVendosur = new WeakMap();

function cakto(perzgjedhesi, html) {
  const element = app.querySelector(perzgjedhesi);
  if (!element || iVendosur.get(element) === html) return element;

  // Fokusi kthehet mbi të njëjtin buton, që rifreskimi të mos e ndërpresë dikë
  // që po lëviz me tastierë.
  const fokusi = element.contains(document.activeElement)
    ? document.activeElement.dataset.fokus
    : null;

  element.innerHTML = html;
  iVendosur.set(element, html);

  if (fokusi) element.querySelector(`[data-fokus="${fokusi}"]`)?.focus();
  return element;
}

/* ── Kartela e gjendjes ────────────────────────────────────────────────── */

function klasaETanit(gjendja) {
  if (!gjendja.dita) return 'tani tani--jashte';
  return `tani tani--${gjendja.faza}`;
}

/**
 * Kartela kryesore. Gjatë natës tregon kush është hapur tani dhe sa i ka mbetur;
 * gjatë ditës tregon kush e merr kujdestarinë sonte dhe pas sa kohe, sepse deri
 * në 22:00 janë hapur të gjitha.
 */
function kartelaTani(sot, gjendja) {
  const { faza, dita, natenIsFilloi } = gjendja;
  if (!dita) return jashtePeriudhes(sot);

  const b = barnatorja(dita.barnatorja);
  const nata = `${dataShkurt(natenIsFilloi)} → ${dataShkurt(dita.kujdestaria.mbaronMe)}`;
  const iHapur = faza === 'nate';

  return `
    <div class="tani__krye">
      <p class="shenjuesi">
        <span class="pika${iHapur ? '' : ' pika--pritje'}" aria-hidden="true"></span>
        ${iHapur ? 'E hapur tani' : 'Kujdestare sonte'}
      </p>
      <p class="tani__dritare">${ikona('nate')} Nata ${nata}</p>
    </div>
    <div class="tani__pjeset">
      <h2 class="tani__emri">${sig(dita.barnatorja)}</h2>
      ${b.adresa ? `<p class="tani__vendi">${ikona('harta')} ${sig(b.adresa)}</p>` : ''}
      ${blokuIKohes(gjendja)}
      ${veprimet(b)}
    </div>
    ${mesazhiDheUdhezimet()}
    ${paralajmerimProjektimi(dita)}
  `;
}

/** Sa i ka mbetur natës — teksti, dhe shiriti kur nata është në vazhdim. */
function blokuIKohes({ faza, mbeten, kaluar, gjatesia }) {
  if (faza !== 'nate') {
    return `
      <div class="koha">
        <p class="koha__rreshti">
          ${ikona('ora')}
          <span>Kujdestaria fillon pas <span class="koha__vlera">${kohaShkurt(mbeten)}</span>, në ora ${orariINates.prej}</span>
        </p>
        <p class="tani__shpjegim">
          Deri atëherë janë hapur të gjitha barnatoret (${iRregullt.prej}–${iRregullt.deri}).
        </p>
      </div>
    `;
  }

  // Gjerësia shkon si atribut i SVG-së, sepse CSP-ja nuk lejon stile inline.
  const pjesa = Math.min(100, Math.max(0, (kaluar / gjatesia) * 100)).toFixed(1);

  // Teksti thotë „mbaron kujdestaria", jo „mbyllet barnatorja": në ora 08:00 kjo
  // barnatore nuk mbyllet, kalon në orarin e rregullt bashkë me të gjitha të tjerat.
  return `
    <div class="koha">
      <p class="koha__rreshti">
        ${ikona('ora')}
        <span>Kujdestaria mbaron pas <span class="koha__vlera">${kohaShkurt(mbeten)}</span>, në ora ${orariINates.deri}</span>
      </p>
      <svg class="shiriti" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true">
        <rect class="shiriti__gjurma" width="100" height="6" />
        <rect class="shiriti__pjesa" width="${pjesa}" height="6" />
      </svg>
      <p class="shiriti__skajet" aria-hidden="true">
        <span>${orariINates.prej}</span>
        <span>${orariINates.deri}</span>
      </p>
    </div>
  `;
}

/** Harta, telefoni, ndarja dhe instalimi; secili shfaqet vetëm nëse ka kuptim. */
function veprimet(b) {
  const butonat = [];

  if (b.harta) {
    butonat.push(`
      <a class="buton buton--kryesor" data-fokus="harta" href="${sig(b.harta)}"
         target="_blank" rel="noopener noreferrer">
        ${ikona('harta')} Hape në Maps
      </a>
    `);
  }

  if (b.telefoni) {
    butonat.push(`
      <a class="buton" data-fokus="telefoni" href="tel:${sig(b.telefoni.replace(/\s+/g, ''))}">
        ${ikona('telefoni')} ${sig(b.telefoni)}
      </a>
    `);
  }

  if (mbështetetNdarja()) {
    butonat.push(`
      <button type="button" class="buton" data-fokus="ndaj" data-veprim="ndaj">
        ${ikona('ndaj')} Ndaje
      </button>
    `);
  }

  if (mundTëInstalohet()) {
    // Kur udhëzimet hapen e mbyllen nga i njëjti buton, `aria-expanded` e thotë atë.
    const shpalos = kërkonUdhëzime() ? ` aria-expanded="${udhëzimetHapur}"` : '';
    butonat.push(`
      <button type="button" class="buton" data-fokus="instalo" data-veprim="instalo"${shpalos}>
        ${ikona('shto')} Instalo si aplikacion
      </button>
    `);
  }

  if (butonat.length === 0) return '';
  return `<div class="veprimet">${butonat.join('')}</div>`;
}

function mesazhiDheUdhezimet() {
  return `
    ${mesazhi ? `<p class="mesazhi" role="status">${sig(mesazhi)}</p>` : ''}
    ${
      udhëzimetHapur
        ? `<p class="udhezimi">
             ${UDHEZIMET[platformaEInstalimit()]}
             Pas instalimit hapet edhe pa internet.
           </p>`
        : ''
    }
  `;
}

function paralajmerimProjektimi(dita) {
  if (dita.zyrtare) return '';
  return `
    <div class="paralajmerim">
      ${ikona('info')}
      <p>
        Kjo datë nuk mbulohet nga orari i publikuar — është vazhdim i llogaritur i rotacionit.
        <a href="${orari.burimet.shpalljet}" target="_blank" rel="noopener noreferrer">Verifikoni te shpalljet zyrtare</a>.
      </p>
    </div>
  `;
}

function jashtePeriudhes(sot) {
  const eArdhshme = orari.kujdestaria.find((d) => d.data > sot);
  return `
    <div class="tani__krye">
      <p class="shenjuesi">
        <span class="pika pika--pritje" aria-hidden="true"></span>
        Jashtë periudhës
      </p>
      <p class="tani__dritare">${ikona('ora')} ${dataShqip(sot)}</p>
    </div>
    <h2 class="tani__jashte">Ky orar nuk e mbulon datën e sotme</h2>
    <p class="tani__shpjegim">
      Orari mbulon ${dataShqip(orari.periudha.prej)} – ${dataShqip(orari.periudha.deri)}.
      ${
        eArdhshme
          ? `Kujdestaria e parë fillon më ${dataShqip(eArdhshme.data)} (${sig(eArdhshme.barnatorja)}).`
          : 'Kontrolloni shpalljet e komunës për orarin e ri.'
      }
    </p>
    <div class="veprimet">
      <a class="buton buton--kryesor" href="${orari.burimet.shpalljet}"
         target="_blank" rel="noopener noreferrer">
        ${ikona('jashte')} Shpalljet e komunës
      </a>
    </div>
  `;
}

/* ── Orari i plotë ─────────────────────────────────────────────────────── */

function shenoMuajinAktiv() {
  for (const buton of app.querySelectorAll('.muaj-buton')) {
    buton.setAttribute('aria-pressed', String(buton.dataset.muaji === muajiAktiv));
  }
}

/** Sjell muajin e zgjedhur në pamje pa e lëvizur faqen — vetëm shiriti rrëshqet. */
function qendroNeMuajinAktiv() {
  const shiriti = app.querySelector('.muaj-shirit');
  const butoni = shiriti?.querySelector('[aria-pressed="true"]');
  if (!shiriti || !butoni) return;
  shiriti.scrollLeft = butoni.offsetLeft - (shiriti.clientWidth - butoni.offsetWidth) / 2;
}

/* ── Vizatimi ──────────────────────────────────────────────────────────── */

function skeleti() {
  return `
    <main class="faqja faqja--hyrje">
      ${kreu()}
      <section class="tani" id="tani"></section>

      <!--
        Netët në vijim dhe orari i plotë janë e njëjta pyetje në dy thellësi:
        «cila natë vjen radhës» dhe «cila natë është data ime». Te telefoni rrinë
        njëra nën tjetrën, si më parë; sapo ekrani ka gjerësi, ato dy dhe
        hapësira e zbrazët anash bëhen dy shtylla — e ngushta për netët, e gjera
        për tabelën, e cila e do gjerësinë.
      -->
      <div class="dyshja">
        <section class="ardhshme" id="ardhshme"></section>
        <section class="orari-plote" id="orari-plote">
          <h2 class="titull-seksioni">Orari i plotë</h2>
          ${shpjegimiIOrarit()}
          <div class="muaj-shirit" role="group" aria-label="Zgjidh muajin">${butonatEMuajve(muajiAktiv)}</div>
          <div id="tabela"></div>
        </section>
        <section class="barnatoret" id="barnatoret"></section>
        ${njoftimiIProjeksionit()}
      </div>
      ${seksioniIPyetjeve()}
      ${fundfaqja()}
    </main>
  `;
}

function vizato() {
  const tani = new Date();
  const sot = dataSot(tani);
  const gjendja = kujdestariaTani(tani);
  // Pas mesnate kujdestaria ende i takon datës së djeshme, prandaj theksimi në tabelë
  // dhe netët në vijim ndjekin natën në fuqi, jo datën kalendarike.
  const nataNeFuqi = gjendja.natenIsFilloi;

  if (!ndertuar) {
    const iCakti = muajt.find((m) => m.celes === nataNeFuqi.slice(0, 7));
    muajiAktiv = (iCakti ?? muajt[0]).celes;
    app.innerHTML = skeleti();
    ndertuar = true;
    qendroNeMuajinAktiv();
  }

  const kartela = cakto('#tani', kartelaTani(sot, gjendja));
  if (kartela) kartela.className = klasaETanit(gjendja);

  cakto('#ardhshme', ardhshmet(nataNeFuqi));
  cakto('#tabela', tabelatEMuajit(muajiAktiv, nataNeFuqi, iGjere.matches));
  cakto('#barnatoret', seksioniIBarnatoreve(gjendja.dita?.barnatorja ?? null, gjendja.faza));

  // Përgjigjja shihet edhe pa u hapur faqja, kur skeda është një nga të shumtat.
  // Fjalët „barnatorja kujdestare" dhe emri i qytetit mbeten aty edhe kur titullin
  // e lexon një kërkues pasi e ka ekzekutuar skriptën.
  document.title = gjendja.dita
    ? `${gjendja.dita.barnatorja} — barnatorja kujdestare ${
        gjendja.faza === 'nate' ? 'tani' : 'sonte'
      } në ${orari.komuna}`
    : TITULLI;
}

/* ── Ngjarjet ──────────────────────────────────────────────────────────── */

app.addEventListener('click', async (event) => {
  const muaji = event.target.closest('.muaj-buton');
  if (muaji) {
    muajiAktiv = muaji.dataset.muaji;
    shenoMuajinAktiv();
    vizato();
    return;
  }

  const veprimi = event.target.closest('[data-veprim]')?.dataset.veprim;
  if (!veprimi) return;

  if (veprimi === 'ndaj') {
    const dal = await ndaj({
      titulli: `Kujdestaria e barnatoreve — ${orari.komuna}`,
      teksti: tekstiPërNdarje(kujdestariaTani(new Date())),
      url: location.href,
    });
    if (dal === 'kopjuar') trego('Lidhja u kopjua.');
    else if (dal === 'deshtoi') trego('Nuk u ndanë dot. Kopjoje lidhjen nga shiriti i shfletuesit.');
    return;
  }

  if (veprimi === 'instalo') {
    if (kërkonUdhëzime()) {
      udhëzimetHapur = !udhëzimetHapur;
      vizato();
      return;
    }
    const pranoi = await instalo();
    if (pranoi) trego('Aplikacioni u instalua.');
  }
});

/** Teksti që dërgohet kur ndahet faqja — i dobishëm edhe pa e hapur lidhjen. */
function tekstiPërNdarje(gjendja) {
  const { dita, natenIsFilloi } = gjendja;
  if (!dita) return `Kujdestaria e barnatoreve në ${orari.komuna}`;

  // Pa datën, „kujdestare tani" bëhet e pasaktë sapo mesazhi lexohet një orë më
  // vonë. Nata e shënuar e bën tekstin të vlefshëm kurdo që të hapet.
  const nata = `${dataShkurt(natenIsFilloi)} → ${dataShkurt(dita.kujdestaria.mbaronMe)}`;
  const vendi = barnatorja(dita.barnatorja).adresa;

  return (
    `Barnatorja kujdestare në ${orari.komuna}, nata ${nata}: ` +
    `${dita.barnatorja}${vendi ? ` (${vendi})` : ''}, ` +
    `e hapur ${orariINates.prej}–${orariINates.deri}.`
  );
}

// Butoni i instalimit shfaqet sapo shfletuesi njofton se faqja mund të instalohet.
vendosNjoftuesin(() => vizato());
regjistroServiceWorker();

vizato();

/**
 * Numërimi i kohës ndërrohet pikërisht në kufirin e minutës, jo 60 sekonda pas
 * hapjes — përndryshe „mbeten 3 h 20 min" do të qëndronte i ngrirë deri sa të
 * mbushej intervali.
 */
function tikuIMinutes() {
  const tani = new Date();
  const deriNeMinuten = 60_000 - (tani.getSeconds() * 1000 + tani.getMilliseconds());
  setTimeout(() => {
    // Faqja e lënë hapur tërë natën nuk ka pse të vizatohet në një skedë që nuk
    // shihet; `visibilitychange` e rifreskon sapo kthehet.
    if (!document.hidden) vizato();
    tikuIMinutes();
  }, deriNeMinuten + 50);
}

tikuIMinutes();

// Kur skeda kthehet pas disa orësh, gjendja rifreskohet menjëherë, pa ringarkim.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) vizato();
});

// Dritarja që zgjerohet mbi 62rem e ndan muajin më dysh — dhe ajo që ngushtohet
// e bashkon prapë. Pa këtë, tabela do ta priste ndërrimin deri te minuta tjetër.
iGjere.addEventListener('change', () => {
  vizato();
  qendroNeMuajinAktiv();
});

// Vercel Analytics. Skripta shërbehet nga vetë domeni (/_vercel/insights), prandaj
// jashtë Vercel-it thjesht nuk ngarkohet — faqja punon njësoj.
inject();
