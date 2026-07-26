import './style.css';
import { inject } from '@vercel/analytics';
import {
  orari,
  barnatorja,
  dataSot,
  dataShkurt,
  dataShqip,
  ditaShkurt,
  emriIMuajit,
  emriIMuajitShkurt,
  kaHarta,
  kohaShkurt,
  kujdestariaTani,
  netNeCikel,
  sipasMuajve,
  tëArdhshmet,
  tëGjithaBarnatoret,
} from './orari.js';
import { ikona, shenjaEFaqes, zemra } from './ikonat.js';
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

/** Kush e ndërtoi faqen — shfaqet te fundfaqja, bashkë me adresën për njoftime. */
const AUTORI = {
  emri: 'Rilind Kyçyku',
  faqja: 'https://rilindkycyku.dev',
  kontakti: 'https://www.rilindkycyku.dev/contacts',
};

/** Muaji i shfaqur në tabelë; ndryshohet nga butonat e muajve. */
let muajiAktiv = null;

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

/** Adresat dhe telefonat shkruhen me dorë te skripta e gjenerimit — nuk shkojnë të pafiltruara në HTML. */
function sig(vlera) {
  return String(vlera ?? '').replace(
    /[&<>"']/g,
    (sh) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[sh],
  );
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

/* ── Kreu ──────────────────────────────────────────────────────────────── */

function kreu() {
  return `
    <header class="kreu">
      ${shenjaEFaqes()}
      <div>
        <p class="kreu__komuna">Komuna e ${sig(orari.komunaGjinore)}</p>
        <h1 class="kreu__titull">Kujdestaria e barnatoreve</h1>
        <p class="kreu__meta">
          <span class="etiketa">${ikona('nate')} Kujdestaria ${orariINates.prej}–${orariINates.deri}</span>
          <span class="etiketa">${dataShqip(orari.periudha.prej)} – ${dataShqip(orari.periudha.deri)}</span>
        </p>
      </div>
    </header>
  `;
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
    <h2 class="tani__emri">${sig(dita.barnatorja)}</h2>
    ${b.adresa ? `<p class="tani__vendi">${ikona('harta')} ${sig(b.adresa)}</p>` : ''}
    ${blokuIKohes(gjendja)}
    ${veprimet(b)}
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
        ${ikona('shto')} Shto në ekran
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

/* ── Netët në vijim ────────────────────────────────────────────────────── */

/** Netët pas asaj që është në fuqi tani — jo pas datës së sotme, që pas mesnate të mos e humbasë një natë. */
function ardhshmet(natenIsFilloi) {
  const ditet = tëArdhshmet(natenIsFilloi, 4);
  if (ditet.length === 0) return '';

  const njesite = ditet
    .map((dita, indeksi) => {
      const klasa = [
        'ardhshme__njesi',
        indeksi === 0 && 'ardhshme__njesi--para',
        !dita.zyrtare && 'ardhshme__njesi--projektim',
      ]
        .filter(Boolean)
        .join(' ');
      return `
        <li class="${klasa}">
          <span class="ardhshme__dita">${ditaShkurt(dita.dita)} ${dataShkurt(dita.data)}</span>
          <span class="ardhshme__emri">${sig(dita.barnatorja)}</span>
        </li>
      `;
    })
    .join('');

  return `
    <h2 class="titull-seksioni">Netët në vijim</h2>
    <ul class="ardhshme__lista">${njesite}</ul>
  `;
}

/* ── Orari i plotë ─────────────────────────────────────────────────────── */

function butonatEMuajve() {
  return muajt
    .map((m) => {
      const projektim = m.ditet.every((d) => !d.zyrtare);
      return `
        <button
          type="button"
          class="muaj-buton${projektim ? ' muaj-buton--projektim' : ''}"
          data-muaji="${m.celes}"
          aria-pressed="${m.celes === muajiAktiv}"
        >${emriIMuajitShkurt(m.celes)}</button>
      `;
    })
    .join('');
}

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

function tabelaEMuajit(natenIsFilloi) {
  const muaji = muajt.find((m) => m.celes === muajiAktiv) ?? muajt[0];

  const rreshtat = muaji.ditet
    .map((dita) => {
      const tani = dita.data === natenIsFilloi;
      const klasa = [
        tani && 'rresht--tani',
        dita.data < natenIsFilloi && 'rresht--kaluar',
      ]
        .filter(Boolean)
        .join(' ');
      return `
        <tr class="${klasa}">
          <td class="qeliza-nata">
            ${dataShkurt(dita.data)}
            <span class="qeliza-nata__deri">→ ${dataShkurt(dita.kujdestaria.mbaronMe)}</span>
          </td>
          <td class="qeliza-dita">
            <span class="qeliza-dita__plote">${dita.dita}</span>
            <span class="qeliza-dita__shkurt">${ditaShkurt(dita.dita)}</span>
          </td>
          <td class="qeliza-emri">${sig(dita.barnatorja)}</td>
          <td class="qeliza-shenja">
            ${tani ? '<span class="shenja shenja--tani">tani</span>' : ''}
            ${dita.zyrtare ? '' : '<span class="shenja shenja--projektim">e projektuar</span>'}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="tabela-mbeshtjellese">
      <table class="tabela">
        <caption class="vetem-lexues">
          Kujdestaria e barnatoreve për ${emriIMuajit(muaji.celes)}
        </caption>
        <thead>
          <tr>
            <th scope="col">Nata</th>
            <th scope="col">Dita</th>
            <th scope="col">Barnatorja</th>
            <th scope="col"><span class="vetem-lexues">Gjendja</span></th>
          </tr>
        </thead>
        <tbody>${rreshtat}</tbody>
      </table>
    </div>
  `;
}

/* ── Barnatoret ────────────────────────────────────────────────────────── */

/**
 * Lista e të gjitha barnatoreve me hartë e telefon; fshihet krejt nëse s'ka asnjë.
 * Kujdestarja e natës në fuqi shënohet — vizualisht me ngjyrë, dhe me tekst për
 * lexuesat e ekranit, që shënimi të mos varet vetëm nga ngjyra.
 */
function seksioniIBarnatoreve(emriKujdestar, faza) {
  if (!kaHarta()) return '';
  const kur = faza === 'nate' ? 'tani' : 'sonte';

  const njesite = tëGjithaBarnatoret()
    .map((b) => {
      const kujdestare = b.emri === emriKujdestar;
      const net = netNeCikel(b.emri);
      const meta = [
        b.adresa,
        `${net} ${net === 1 ? 'natë' : 'net'} për ${orari.projeksioni.gjatesiaECiklit} ditë`,
      ]
        .filter(Boolean)
        .join(' · ');

      return `
        <li class="barnatorja${kujdestare ? ' barnatorja--kujdestare' : ''}">
          <span class="barnatorja__shkronja" aria-hidden="true">${sig(b.emri.charAt(0))}</span>
          <span class="barnatorja__krye">
            <span class="barnatorja__emri">
              ${sig(b.emri)}${kujdestare ? `<span class="vetem-lexues"> — kujdestare ${kur}</span>` : ''}
            </span>
            <span class="barnatorja__meta">${sig(meta)}</span>
          </span>
          <span class="barnatorja__veprimet">
            ${
              b.harta
                ? `<a class="buton buton--ikona" href="${sig(b.harta)}" target="_blank"
                      rel="noopener noreferrer" aria-label="Hape ${sig(b.emri)} në Google Maps">
                     ${ikona('harta')}
                   </a>`
                : ''
            }
            ${
              b.telefoni
                ? `<a class="buton buton--ikona" href="tel:${sig(b.telefoni.replace(/\s+/g, ''))}"
                      aria-label="Telefono ${sig(b.emri)} — ${sig(b.telefoni)}">
                     ${ikona('telefoni')}
                   </a>`
                : ''
            }
          </span>
        </li>
      `;
    })
    .join('');

  return `
    <h2 class="titull-seksioni">Barnatoret</h2>
    <ul class="barnatoret__lista">${njesite}</ul>
  `;
}

/* ── Njoftimi dhe fundfaqja ────────────────────────────────────────────── */

function njoftimiIProjeksionit() {
  return `
    <section class="njoftim">
      <h2 class="titull-seksioni">Për datat pas ${dataShqip(orari.periudha.zyrtareDeri)}</h2>
      <p>${sig(orari.projeksioni.shpjegimi)}</p>
      <p>
        <a class="lidhje-jashtme" href="${orari.burimet.shpalljet}" target="_blank" rel="noopener noreferrer">
          Shpalljet zyrtare të Komunës së ${sig(orari.komunaGjinore)} ${ikona('jashte')}
        </a>
      </p>
    </section>
  `;
}

/**
 * Njoftimi për gabim. Orari transkriptohet me dorë nga një skanim, dhe rotacioni
 * pas 31.08 është i llogaritur — prandaj një datë e shkëmbyer është e mundshme,
 * dhe personi që e vë re duhet të ketë ku ta thotë pa u dashur të hapë GitHub.
 */
function raportoGabim() {
  return `
    <div class="raporto">
      <p class="raporto__tekst">
        <strong>A ka gabim në orar?</strong>
        Nëse një datë, orë ose barnatore nuk përputhet me shpalljen e komunës, njoftoni
        që të përmirësohet.
      </p>
      <a class="buton" href="${sig(AUTORI.kontakti)}" target="_blank" rel="noopener noreferrer">
        ${ikona('njofto')} Njofto
      </a>
    </div>
  `;
}

function fundfaqja() {
  const bazat = orari.bazaLigjore.map((b) => `<li>${sig(b)}</li>`).join('');
  return `
    <footer class="fundfaqja">
      <h2 class="titull-seksioni">Burimi zyrtar</h2>

      <details class="detaje">
        <summary class="detaje__krye">
          Orari, sezonet dhe baza ligjore
          ${ikona('shigjeta', 'ikona detaje__shigjeta')}
        </summary>
        <div class="detaje__trupi">
          <p>
            <strong>Orari i rregullt ${iRregullt.prej}–${iRregullt.deri}:</strong>
            ${sig(iRregullt.shpjegimi)}
          </p>
          <p>
            <strong>Kujdestaria ${orariINates.prej}–${orariINates.deri}:</strong>
            ${sig(orariINates.shpjegimi)}
          </p>
          <p>
            <strong>Sezoni veror</strong> (deri më ${dataShqip(orari.sezonet.veror.mbaron)}):
            ${sig(orari.sezonet.veror.pershkrimi)}
            Orari ${orari.sezonet.veror.prej}–${orari.sezonet.veror.deri}.
          </p>
          <p>
            <strong>Sezoni dimëror</strong> (nga ${dataShqip(orari.sezonet.dimeror.fillon)}):
            ${sig(orari.sezonet.dimeror.pershkrimi)}
          </p>
          <ul class="detaje__lista">${bazat}</ul>
          <p>
            ${sig(orari.institucioni)}, Komuna e ${sig(orari.komunaGjinore)} ·
            ${sig(orari.referenca)} · ${dataShqip(orari.dataEDokumentit)} ·
            ${sig(orari.nenshkroi.pozita)}, ${sig(orari.nenshkroi.emri)}
          </p>
        </div>
      </details>

      <p class="fundfaqja__meta">
        Të dhënat janë transkriptim i dokumentit zyrtar të skanuar.
        <a class="lidhje-jashtme" href="${orari.burimet.dokumenti}" target="_blank" rel="noopener noreferrer">
          Dokumenti burimor (PDF) ${ikona('jashte')}
        </a>
      </p>

      ${raportoGabim()}
      <p class="fundfaqja__autori">
        Bërë me ${zemra()} nga
        <a href="${sig(AUTORI.faqja)}" target="_blank" rel="noopener noreferrer">${sig(AUTORI.emri)}</a>
        për qytetarët e Komunës së ${sig(orari.komunaGjinore)}.
      </p>
    </footer>
  `;
}

/* ── Vizatimi ──────────────────────────────────────────────────────────── */

function skeleti() {
  return `
    <main class="faqja faqja--hyrje">
      ${kreu()}
      <section class="tani" id="tani"></section>
      <section class="ardhshme" id="ardhshme"></section>
      <section class="orari-plote">
        <h2 class="titull-seksioni">Orari i plotë</h2>
        <p class="orari-plote__shpjegim">
          Një rresht është një natë: prej ora ${orariINates.prej} të datës së parë
          deri në ora ${orariINates.deri} të nesërmen.
        </p>
        <div class="muaj-shirit" role="group" aria-label="Zgjidh muajin">${butonatEMuajve()}</div>
        <div id="tabela"></div>
      </section>
      <section class="barnatoret" id="barnatoret"></section>
      ${njoftimiIProjeksionit()}
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
  cakto('#tabela', tabelaEMuajit(nataNeFuqi));
  cakto('#barnatoret', seksioniIBarnatoreve(gjendja.dita?.barnatorja ?? null, gjendja.faza));

  // Përgjigjja shihet edhe pa u hapur faqja, kur skeda është një nga të shumtat.
  document.title = gjendja.dita
    ? `${gjendja.dita.barnatorja} — kujdestare ${gjendja.faza === 'nate' ? 'tani' : 'sonte'} · ${orari.komuna}`
    : `Kujdestaria e barnatoreve — ${orari.komuna}`;
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
    if (pranoi) trego('U shtua në ekranin kryesor.');
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
    vizato();
    tikuIMinutes();
  }, deriNeMinuten + 50);
}

tikuIMinutes();

// Kur skeda kthehet pas disa orësh, gjendja rifreskohet menjëherë, pa ringarkim.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) vizato();
});

// Vercel Analytics. Skripta shërbehet nga vetë domeni (/_vercel/insights), prandaj
// jashtë Vercel-it thjesht nuk ngarkohet — faqja punon njësoj.
inject();
