import './style.css';
import {
  orari,
  dataSot,
  dataShkurt,
  dataShqip,
  ditetMes,
  emriIMuajitShkurt,
  kujdestariaTani,
  sipasMuajve,
  tëArdhshmet,
} from './orari.js';

const app = document.querySelector('#app');
const muajt = sipasMuajve();
const { iRregullt, kujdestaria: orariINates } = orari.orari;

/** Muaji i shfaqur në tabelë; ndryshohet nga butonat e muajve. */
let muajiAktiv = null;

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
      <h2 class="kartela__emri">${dita.barnatorja}</h2>
      <p class="kartela__orari">${statusi}</p>
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
          <span class="ardhshme__emri">${dita.barnatorja}</span>
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
          <td class="qeliza-emri">${dita.barnatorja}${shenjaProjektim(dita)}</td>
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
      ${vijaEArdhshme(nataNeFuqi)}
      ${tabelaEMuajit(nataNeFuqi)}
      ${njoftimiIProjeksionit()}
      ${fundfaqja()}
    </main>
  `;
}

app.addEventListener('click', (event) => {
  const buton = event.target.closest('.muaj-buton');
  if (!buton) return;
  muajiAktiv = buton.dataset.muaji;
  vizato();
});

vizato();

// Rifreskohet kur ndërrohet dita ose kur barnatorja hapet/mbyllet, pa e ringarkuar faqen.
setInterval(vizato, 60_000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) vizato();
});
