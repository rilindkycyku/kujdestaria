import './style.css';
import { inject } from '@vercel/analytics';
import {
  orari,
  dataSot,
  barnatorja,
  dataShkurt,
  dataShqip,
  ditetMes,
  emriIMuajitShkurt,
  kaHarta,
  kujdestariaTani,
  sipasMuajve,
  tëArdhshmet,
  tëGjithaBarnatoret,
} from './orari.js';
import {
  eshteIOS,
  instalo,
  kërkonUdhëzimeIOS,
  mbështetetNdarja,
  mundTëInstalohet,
  ndaj,
  regjistroServiceWorker,
  vendosNjoftuesin,
} from './veprimet.js';

const app = document.querySelector('#app');
const muajt = sipasMuajve();
const { iRregullt, kujdestaria: orariINates } = orari.orari;

/** Kush e ndërtoi faqen — shfaqet te fundfaqja. */
const AUTORI = { emri: 'Rilind Kyçyku', faqja: 'https://rilindkycyku.dev' };

/** Muaji i shfaqur në tabelë; ndryshohet nga butonat e muajve. */
let muajiAktiv = null;

/** Mesazh i shkurtër pas një veprimi, p.sh. „Lidhja u kopjua". */
let mesazhi = null;
let afatiIMesazhit = null;

/** Udhëzimet e iOS-it shfaqen vetëm pasi shtypet butoni i instalimit. */
let udhëzimetIOS = false;

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

/** Butoni „Hape në Maps" — shfaqet vetëm kur barnatorja ka lidhje të vlefshme. */
function butoniIHartes(emri, klasa = 'lidhje-harte') {
  const { harta } = barnatorja(emri);
  if (!harta) return '';
  return `
    <a class="${klasa}" href="${sig(harta)}" target="_blank" rel="noopener noreferrer">
      <span aria-hidden="true">📍</span> Hape në Maps
    </a>
  `;
}

function shenjaProjektim(dita) {
  return dita.zyrtare ? '' : '<span class="shenja shenja--projektim">e projektuar</span>';
}

function paralajmerimProjektimi(dita) {
  if (dita.zyrtare) return '';
  return `
    <p class="kartela__paralajmerim">
      Kjo datë nuk mbulohet nga orari i publikuar — është vazhdim i llogaritur i rotacionit.
      <a href="${orari.burimet.shpalljet}" target="_blank" rel="noopener noreferrer">Verifikoni te shpalljet zyrtare</a>.
    </p>
  `;
}

/** Adresa, telefoni dhe harta e barnatores kujdestare — çka ekziston. */
function kontaktetEKartelës(emri) {
  const { adresa, telefoni, harta } = barnatorja(emri);
  if (!adresa && !telefoni && !harta) return '';
  return `
    <div class="kartela__kontaktet">
      ${adresa ? `<p class="kartela__adresa">${sig(adresa)}</p>` : ''}
      <p class="kartela__veprimet">
        ${butoniIHartes(emri, 'lidhje-harte lidhje-harte--kryesore')}
        ${
          telefoni
            ? `<a class="lidhje-harte" href="tel:${sig(telefoni.replace(/\s+/g, ''))}">
                 <span aria-hidden="true">📞</span> ${sig(telefoni)}
               </a>`
            : ''
        }
      </p>
    </div>
  `;
}

function kartelaJashtePeriudhes(sot) {
  const eArdhshme = orari.kujdestaria.find((d) => d.data > sot);
  return `
    <section class="kartela kartela--jashte">
      <p class="kartela__etiketa">${dataShqip(sot)}</p>
      <h2 class="kartela__jashte">Jashtë periudhës së këtij orari</h2>
      <p class="kartela__shpjegim">
        Ky orar mbulon ${dataShqip(orari.periudha.prej)} – ${dataShqip(orari.periudha.deri)}.
        ${
          eArdhshme
            ? `Kujdestaria e parë fillon më ${dataShqip(eArdhshme.data)} (${eArdhshme.barnatorja}).`
            : 'Kontrolloni shpalljet e komunës për orarin e ri.'
        }
      </p>
      <p class="kartela__shpjegim">
        <a href="${orari.burimet.shpalljet}" target="_blank" rel="noopener noreferrer">
          Shpalljet zyrtare të Komunës së ${orari.komunaGjinore}
        </a>
      </p>
    </section>
  `;
}

/**
 * Kartela kryesore. Gjatë natës tregon kush është i hapur tani; gjatë ditës tregon
 * kush e merr kujdestarinë sonte, sepse deri në 22:00 janë hapur të gjitha.
 */
function kartelaTani(sot, gjendja) {
  const { faza, dita, natenIsFilloi } = gjendja;
  if (!dita) return kartelaJashtePeriudhes(sot);

  const nata = `${dataShkurt(natenIsFilloi)} → ${dataShkurt(dita.kujdestaria.mbaronMe)}`;

  const etiketa =
    faza === 'nate'
      ? `Kujdestare tani · nata ${nata}`
      : `Kujdestare sonte · ${dita.dita}, ${dataShqip(dita.data)}`;

  const statusi =
    faza === 'nate'
      ? `<span class="pika pika--hapur" aria-hidden="true"></span>
         E hapur deri në ora ${orariINates.deri}`
      : `<span class="pika pika--pritje" aria-hidden="true"></span>
         Kujdestaria fillon në ora ${orariINates.prej} · nata ${nata}`;

  return `
    <section class="kartela${dita.zyrtare ? '' : ' kartela--projektim'}">
      <p class="kartela__etiketa">${etiketa}</p>
      <h2 class="kartela__emri">${sig(dita.barnatorja)}</h2>
      <p class="kartela__orari">${statusi}</p>
      ${kontaktetEKartelës(dita.barnatorja)}
      ${
        faza === 'dite'
          ? `<p class="kartela__shpjegim">
               Deri në ora ${iRregullt.deri} të gjitha barnatoret janë hapur
               (${iRregullt.prej}–${iRregullt.deri}).
             </p>`
          : ''
      }
      ${paralajmerimProjektimi(dita)}
    </section>
  `;
}

/** Butonat e ndarjes dhe të instalimit; secili shfaqet vetëm nëse ka kuptim. */
function shiritiIVeprimeve() {
  const butonat = [];

  if (mbështetetNdarja()) {
    butonat.push(`
      <button type="button" class="veprim" data-veprim="ndaj">
        <span aria-hidden="true">↗</span> Ndaje
      </button>
    `);
  }

  if (mundTëInstalohet()) {
    butonat.push(`
      <button type="button" class="veprim" data-veprim="instalo">
        <span aria-hidden="true">＋</span> Shto në ekran
      </button>
    `);
  }

  if (butonat.length === 0 && !mesazhi) return '';

  return `
    <section class="veprimet">
      <div class="veprimet__butonat">${butonat.join('')}</div>
      ${mesazhi ? `<p class="veprimet__mesazh" role="status">${sig(mesazhi)}</p>` : ''}
      ${
        udhëzimetIOS
          ? `<p class="veprimet__udhezim">
               Në iPhone: shtyp <strong>Share</strong> në shiritin e Safari-t, pastaj
               <strong>Add to Home Screen</strong>.
             </p>`
          : ''
      }
    </section>
  `;
}

/** Teksti që dërgohet kur ndahet faqja — i dobishëm edhe pa e hapur lidhjen. */
function tekstiPërNdarje(gjendja) {
  const { faza, dita } = gjendja;
  if (!dita) return 'Kujdestaria e barnatoreve në Kaçanik';
  return faza === 'nate'
    ? `Kujdestare tani në Kaçanik: ${dita.barnatorja} — e hapur deri në ora ${orariINates.deri}.`
    : `Kujdestare sonte në Kaçanik: ${dita.barnatorja} — prej ora ${orariINates.prej} deri në ${orariINates.deri}.`;
}

/** Netët pas asaj që është në fuqi tani — jo pas datës së sotme, që pas mesnate të mos e humbasë një natë. */
function vijaEArdhshme(natenIsFilloi) {
  const ditet = tëArdhshmet(natenIsFilloi, 4);
  if (ditet.length === 0) return '';

  const qelizat = ditet
    .map((dita) => {
      const larg = ditetMes(natenIsFilloi, dita.data);
      const etiketa = larg === 1 ? 'Nata e ardhshme' : `${dita.dita} ${dataShkurt(dita.data)}`;
      return `
        <li class="ardhshme__njesi${dita.zyrtare ? '' : ' ardhshme__njesi--projektim'}">
          <span class="ardhshme__dita">${etiketa}</span>
          <span class="ardhshme__emri">${sig(dita.barnatorja)}</span>
        </li>
      `;
    })
    .join('');

  return `
    <section class="ardhshme">
      <h2 class="titull-seksioni">Netët në vijim</h2>
      <ul class="ardhshme__lista">${qelizat}</ul>
    </section>
  `;
}

function tabelaEMuajit(natenIsFilloi) {
  const muaji = muajt.find((m) => m.celes === muajiAktiv) ?? muajt[0];

  const butonat = muajt
    .map((m) => {
      const aktiv = m.celes === muaji.celes;
      const projektim = m.ditet.every((d) => !d.zyrtare);
      return `
        <button
          type="button"
          class="muaj-buton${aktiv ? ' muaj-buton--aktiv' : ''}${projektim ? ' muaj-buton--projektim' : ''}"
          data-muaji="${m.celes}"
          aria-pressed="${aktiv}"
        >${emriIMuajitShkurt(m.celes)}</button>
      `;
    })
    .join('');

  const rreshtat = muaji.ditet
    .map((dita) => {
      const tani = dita.data === natenIsFilloi;
      const kaluar = dita.data < natenIsFilloi;
      const klasa = [
        'rresht',
        tani && 'rresht--tani',
        kaluar && 'rresht--kaluar',
        !dita.zyrtare && 'rresht--projektim',
      ]
        .filter(Boolean)
        .join(' ');
      return `
        <tr class="${klasa}">
          <td class="qeliza-data">
            ${dataShqip(dita.data)}${tani ? '<span class="shenja shenja--tani">tani</span>' : ''}
          </td>
          <td class="qeliza-dite">${dita.dita}</td>
          <td class="qeliza-emri">${sig(dita.barnatorja)}${shenjaProjektim(dita)}</td>
          <td class="qeliza-orari">
            ${dita.kujdestaria.prej}–${dita.kujdestaria.deri}
            <span class="qeliza-nesër">${dataShkurt(dita.kujdestaria.mbaronMe)}</span>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <section class="orari-plote">
      <h2 class="titull-seksioni">Orari i plotë</h2>
      <p class="orari-plote__shpjegim">
        Data tregon natën që fillon atë ditë në ora ${orariINates.prej} dhe mbaron në
        ora ${orariINates.deri} të nesërmen.
      </p>
      <div class="muaj-shirit" role="group" aria-label="Zgjidh muajin">${butonat}</div>
      <div class="tabela-mbeshtjellese">
        <table class="tabela">
          <caption class="vetem-lexues">Kujdestaria e barnatoreve për ${emriIMuajitShkurt(muaji.celes)} 2026</caption>
          <thead>
            <tr>
              <th scope="col">Data</th>
              <th scope="col">Dita</th>
              <th scope="col">Barnatorja</th>
              <th scope="col">Kujdestaria</th>
            </tr>
          </thead>
          <tbody>${rreshtat}</tbody>
        </table>
      </div>
    </section>
  `;
}

/** Lista e të gjitha barnatoreve me hartë e telefon; fshihet krejt nëse s'ka asnjë. */
function seksioniIBarnatoreve() {
  if (!kaHarta()) return '';

  const njesite = tëGjithaBarnatoret()
    .map(
      (b) => `
        <li class="barnatorja">
          <div class="barnatorja__krye">
            <span class="barnatorja__emri">${sig(b.emri)}</span>
            ${b.adresa ? `<span class="barnatorja__adresa">${sig(b.adresa)}</span>` : ''}
          </div>
          <div class="barnatorja__veprimet">
            ${butoniIHartes(b.emri)}
            ${
              b.telefoni
                ? `<a class="lidhje-harte" href="tel:${sig(b.telefoni.replace(/\s+/g, ''))}">
                     <span aria-hidden="true">📞</span> ${sig(b.telefoni)}
                   </a>`
                : ''
            }
          </div>
        </li>
      `,
    )
    .join('');

  return `
    <section class="barnatoret">
      <h2 class="titull-seksioni">Barnatoret</h2>
      <ul class="barnatoret__lista">${njesite}</ul>
    </section>
  `;
}

function njoftimiIProjeksionit() {
  return `
    <section class="njoftim">
      <h2 class="titull-seksioni">Për datat pas ${dataShqip(orari.periudha.zyrtareDeri)}</h2>
      <p>${orari.projeksioni.shpjegimi}</p>
      <p>
        <a class="lidhje-theksuar" href="${orari.burimet.shpalljet}" target="_blank" rel="noopener noreferrer">
          Shpalljet zyrtare të Komunës së ${orari.komunaGjinore} →
        </a>
      </p>
    </section>
  `;
}

function fundfaqja() {
  const bazat = orari.bazaLigjore.map((b) => `<li>${b}</li>`).join('');
  return `
    <footer class="fundfaqja">
      <h2 class="titull-seksioni">Baza dhe orari zyrtar</h2>
      <p>
        <strong>Orari i rregullt ${iRregullt.prej}–${iRregullt.deri}:</strong>
        ${iRregullt.shpjegimi}
      </p>
      <p>
        <strong>Kujdestaria ${orariINates.prej}–${orariINates.deri}:</strong>
        ${orariINates.shpjegimi}
      </p>
      <ul class="fundfaqja__lista">${bazat}</ul>
      <p>
        <strong>Sezoni veror</strong> (deri më ${dataShqip(orari.sezonet.veror.mbaron)}):
        ${orari.sezonet.veror.pershkrimi}
        Orari ${orari.sezonet.veror.prej}–${orari.sezonet.veror.deri}.
      </p>
      <p>
        <strong>Sezoni dimëror</strong> (nga ${dataShqip(orari.sezonet.dimeror.fillon)}):
        ${orari.sezonet.dimeror.pershkrimi}
      </p>
      <p class="fundfaqja__meta">
        ${orari.institucioni}, Komuna e ${orari.komunaGjinore} ·
        ${orari.referenca} · ${dataShqip(orari.dataEDokumentit)} ·
        ${orari.nenshkroi.pozita}, ${orari.nenshkroi.emri}
      </p>
      <p class="fundfaqja__meta">
        Të dhënat janë transkriptim i dokumentit zyrtar të skanuar.
        <a href="${orari.burimet.dokumenti}" target="_blank" rel="noopener noreferrer">Dokumenti burimor (PDF)</a>
        ·
        <a href="${orari.burimet.shpalljet}" target="_blank" rel="noopener noreferrer">Të gjitha shpalljet</a>
      </p>
      <p class="fundfaqja__autori">
        Ndërtuar nga
        <a href="${sig(AUTORI.faqja)}" target="_blank" rel="noopener noreferrer">${sig(AUTORI.emri)}</a>
      </p>
    </footer>
  `;
}

function vizato() {
  const tani = new Date();
  const sot = dataSot(tani);
  const gjendja = kujdestariaTani(tani);
  // Pas mesnate kujdestaria ende i takon datës së djeshme, prandaj theksimi në tabelë
  // dhe netët në vijim ndjekin natën në fuqi, jo datën kalendarike.
  const nataNeFuqi = gjendja.natenIsFilloi;

  if (muajiAktiv === null) {
    const iCakti = muajt.find((m) => m.celes === nataNeFuqi.slice(0, 7));
    muajiAktiv = (iCakti ?? muajt[0]).celes;
  }

  app.innerHTML = `
    <main class="faqja">
      <header class="kreu">
        <p class="kreu__komuna">Komuna e ${orari.komunaGjinore}</p>
        <h1 class="kreu__titull">Kujdestaria e barnatoreve</h1>
        <p class="kreu__periudha">
          Kujdestaria ${orariINates.prej}–${orariINates.deri} ·
          ${dataShqip(orari.periudha.prej)} – ${dataShqip(orari.periudha.deri)}
        </p>
      </header>
      ${kartelaTani(sot, gjendja)}
      ${shiritiIVeprimeve()}
      ${vijaEArdhshme(nataNeFuqi)}
      ${tabelaEMuajit(nataNeFuqi)}
      ${seksioniIBarnatoreve()}
      ${njoftimiIProjeksionit()}
      ${fundfaqja()}
    </main>
  `;
}

app.addEventListener('click', async (event) => {
  const muaji = event.target.closest('.muaj-buton');
  if (muaji) {
    muajiAktiv = muaji.dataset.muaji;
    vizato();
    return;
  }

  const veprimi = event.target.closest('.veprim')?.dataset.veprim;
  if (!veprimi) return;

  if (veprimi === 'ndaj') {
    const dal = await ndaj({
      titulli: 'Kujdestaria e barnatoreve — Kaçanik',
      teksti: tekstiPërNdarje(kujdestariaTani(new Date())),
      url: location.href,
    });
    if (dal === 'kopjuar') trego('Lidhja u kopjua.');
    else if (dal === 'deshtoi') trego('Nuk u ndanë dot. Kopjoje lidhjen nga shiriti i shfletuesit.');
    return;
  }

  if (veprimi === 'instalo') {
    if (kërkonUdhëzimeIOS()) {
      udhëzimetIOS = !udhëzimetIOS;
      vizato();
      return;
    }
    const pranoi = await instalo();
    if (pranoi) trego('U shtua në ekranin kryesor.');
  }
});

// Butoni i instalimit shfaqet sapo shfletuesi njofton se faqja mund të instalohet.
vendosNjoftuesin(() => vizato());
regjistroServiceWorker();

vizato();

// Rifreskohet kur ndërrohet dita ose kur barnatorja hapet/mbyllet, pa e ringarkuar faqen.
setInterval(vizato, 60_000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) vizato();
});

// Vercel Analytics. Skripta shërbehet nga vetë domeni (/_vercel/insights), prandaj
// jashtë Vercel-it thjesht nuk ngarkohet — faqja punon njësoj.
inject();
