/**
 * Pjesët e faqes që nuk varen nga çasti — HTML si varg, pa prekur DOM-in.
 *
 * Të njëjtat funksione thirren dy herë: në shfletues nga [`main.js`](main.js),
 * dhe në Node nga [`scripts/parafaqja.mjs`](../scripts/parafaqja.mjs), që
 * `dist/index.html` të dalë me përmbajtje të gatshme brenda. Kështu orari lexohet
 * nga kërkuesit dhe nga kushdo që nuk ekzekuton JavaScript, pa u shkruar dy herë.
 *
 * Rregulli i vetëm këtu: asnjë `document`, `navigator` as `new Date()` — vetëm
 * të dhënat dhe argumentet. Ajo që ndryshon çdo minutë rri te `main.js`.
 */
import {
  orari,
  kaHarta,
  netNeCikel,
  sipasMuajve,
  tëArdhshmet,
  tëGjithaBarnatoret,
} from './orari.js';
import {
  dataShkurt,
  dataShqip,
  ditaShkurt,
  emriIMuajit,
  emriIMuajitShkurt,
} from './koha.js';
import { ikona, shenjaEFaqes, zemra } from './ikonat.js';

const muajt = sipasMuajve();
const { iRregullt, kujdestaria: orariINates } = orari.orari;

/** Kush e ndërtoi faqen — shfaqet te fundfaqja, bashkë me adresën për njoftime. */
export const AUTORI = {
  emri: 'Rilind Kyçyku',
  faqja: 'https://rilindkycyku.dev',
  kontakti: 'https://www.rilindkycyku.dev/contacts',
};

/**
 * Titulli dhe përshkrimi i faqes, të ndërtuar nga vetë të dhënat.
 *
 * Ndërtimi i shkruan te `<head>`-i i `dist/index.html`, prandaj kur komuna
 * publikon orarin e ri dhe rigjenerohet JSON-i, nuk mbetet asnjë vit i vjetër
 * te rezultati i kërkimit. Teksti i `index.html` është vetëm rezervë për `npm run dev`.
 */
export const TITULLI = `Barnatorja kujdestare në ${orari.komuna} — orari i kujdestarisë`;

export const PERSHKRIMI =
  `Cila barnatore është kujdestare sonte në ${orari.komuna}, e hapur ` +
  `${orariINates.prej}–${orariINates.deri}. Orari zyrtar i kujdestarisë natë për natë, ` +
  `me adresa dhe harta. Punon edhe pa internet.`;

/** Adresat dhe telefonat shkruhen me dorë te skripta e gjenerimit — nuk shkojnë të pafiltruara në HTML. */
export function sig(vlera) {
  return String(vlera ?? '').replace(
    /[&<>"']/g,
    (sh) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[sh],
  );
}

/** `'2026-07-01'` → `<time datetime="2026-07-01">01.07</time>`, që data të lexohet edhe nga makinat. */
function data(vlera, teksti = dataShkurt(vlera)) {
  return `<time datetime="${vlera}">${teksti}</time>`;
}

/* ── Kreu ──────────────────────────────────────────────────────────────── */

export function kreu() {
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

/* ── Netët në vijim ────────────────────────────────────────────────────── */

/** Netët pas asaj që është në fuqi tani — jo pas datës së sotme, që pas mesnate të mos e humbasë një natë. */
export function ardhshmet(natenIsFilloi) {
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
          <span class="ardhshme__dita">${ditaShkurt(dita.dita)} ${data(dita.data)}</span>
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

/** Shpjegimi që qëndron mbi tabelë: një rresht = një natë, jo një ditë. */
export function shpjegimiIOrarit() {
  return `
    <p class="orari-plote__shpjegim">
      Një rresht është një natë: prej ora ${orariINates.prej} të datës së parë
      deri në ora ${orariINates.deri} të nesërmen.
    </p>
  `;
}

export function butonatEMuajve(muajiAktiv) {
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

/**
 * Tabela e një muaji. `nataNeFuqi` mund të jetë `null` — atëherë asnjë rresht nuk
 * shënohet si „tani", çka i duhet ndërtimit: HTML-ja e ruajtur nuk e di se kur lexohet.
 */
export function tabelaEMuajit(celesiIMuajit, nataNeFuqi = null) {
  const muaji = muajt.find((m) => m.celes === celesiIMuajit) ?? muajt[0];

  const rreshtat = muaji.ditet
    .map((dita) => {
      const tani = dita.data === nataNeFuqi;
      const klasa = [
        tani && 'rresht--tani',
        nataNeFuqi && dita.data < nataNeFuqi && 'rresht--kaluar',
      ]
        .filter(Boolean)
        .join(' ');
      return `
        <tr class="${klasa}">
          <td class="qeliza-nata">
            ${data(dita.data)}
            <span class="qeliza-nata__deri">→ ${data(dita.kujdestaria.mbaronMe)}</span>
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
export function seksioniIBarnatoreve(emriKujdestar = null, faza = null) {
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

/* ── Pyetjet e shpeshta ────────────────────────────────────────────────── */

/**
 * Pyetjet që njerëzit shkruajnë te kërkimi: „a ka barnatore hapur natën",
 * „deri në sa orë punojnë barnatoret". Të njëjtat pyetje e përgjigje shkojnë
 * edhe te `FAQPage` i [`skema.js`](skema.js) — Google-i i pranon vetëm nëse
 * teksti duket edhe në faqe, prandaj burimi është një i vetëm.
 */
export function pyetjet() {
  const emrat = tëGjithaBarnatoret().map((b) => b.emri);
  const emratMeVirgulla = `${emrat.slice(0, -1).join(', ')} dhe ${emrat.at(-1)}`;

  return [
    {
      pyetja: `Cila barnatore është kujdestare tani në ${orari.komuna}?`,
      pergjigjja:
        `Kujdestarja ndërrohet çdo natë sipas një rotacioni ${orari.projeksioni.gjatesiaECiklit}-ditor ` +
        `të Komunës së ${orari.komunaGjinore}. Kartela në krye të kësaj faqeje tregon barnatoren e natës ` +
        `në vazhdim me adresën, hartën dhe kohën e mbetur, ndërsa tabela më poshtë e jep orarin natë për natë.`,
    },
    {
      pyetja: `Sa është orari i kujdestarisë së barnatoreve në ${orari.komuna}?`,
      pergjigjja:
        `Kujdestaria zgjat prej ora ${orariINates.prej} deri në ora ${orariINates.deri} të nesërmen. ` +
        `Deri në ora ${iRregullt.deri} janë hapur të gjitha barnatoret, me orarin e rregullt ` +
        `${iRregullt.prej}–${iRregullt.deri}.`,
    },
    {
      pyetja: `A ka barnatore të hapur natën në ${orari.komuna}?`,
      pergjigjja:
        `Po. Çdo natë një barnatore e vetme qëndron e hapur prej ${orariINates.prej} deri në ` +
        `${orariINates.deri}, edhe të shtunave, të dielave e festave. Cila është, e cakton orari i kujdestarisë.`,
    },
    {
      pyetja: `Cilat barnatore marrin pjesë në kujdestari në ${orari.komuna}?`,
      pergjigjja: `Në rotacion janë ${emrat.length} barnatore: ${emratMeVirgulla}.`,
    },
    {
      pyetja: 'Nga vjen ky orar dhe a është zyrtar?',
      pergjigjja:
        `Orari është transkriptim i dokumentit zyrtar „${orari.titulli}“ (${orari.referenca}, ` +
        `${dataShqip(orari.dataEDokumentit)}), lëshuar nga ${orari.institucioni} e Komunës së ` +
        `${orari.komunaGjinore}. Dokumenti mbulon ${orari.periudha.titulliZyrtar}; datat pas ` +
        `${dataShqip(orari.periudha.zyrtareDeri)} janë vazhdim i llogaritur i të njëjtit rotacion dhe ` +
        `shënohen si të projektuara.`,
    },
  ];
}

export function seksioniIPyetjeve() {
  const njesite = pyetjet()
    .map(
      ({ pyetja, pergjigjja }) => `
        <li class="pyetje">
          <h3 class="pyetje__titulli">${sig(pyetja)}</h3>
          <p class="pyetje__pergjigjja">${sig(pergjigjja)}</p>
        </li>
      `,
    )
    .join('');

  return `
    <section class="pyetjet">
      <h2 class="titull-seksioni">Pyetjet e shpeshta</h2>
      <ul class="pyetjet__lista">${njesite}</ul>
    </section>
  `;
}

/* ── Njoftimi dhe fundfaqja ────────────────────────────────────────────── */

export function njoftimiIProjeksionit() {
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

export function fundfaqja() {
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

/* ── Faqja e ruajtur ───────────────────────────────────────────────────── */

/**
 * Faqja ashtu si shkruhet te `dist/index.html` gjatë ndërtimit — pa asgjë që
 * varet nga çasti i leximit.
 *
 * Kartela „tani" dhe „netët në vijim" do të ishin gënjeshtër këtu: HTML-ja
 * shkruhet një herë dhe lexohet muaj më vonë. Në vend të tyre shkon orari i
 * plotë i të gjithë muajve — pikërisht ajo që i duhet edhe kërkuesit, edhe
 * dikujt me JavaScript të fikur. Sapo skripta ngarkohet, `main.js` e zëvendëson
 * këtë me pamjen e drejtpërdrejtë.
 */
export function faqjaStatike() {
  const tabelat = muajt
    .map(
      (m) => `
        <h3 class="titull-seksioni">${emriIMuajit(m.celes)}</h3>
        ${tabelaEMuajit(m.celes)}
      `,
    )
    .join('');

  return `
    <main class="faqja">
      ${kreu()}

      <section class="tani">
        <div class="tani__krye">
          <p class="shenjuesi">
            <span class="pika pika--pritje" aria-hidden="true"></span>
            Kujdestaria e natës
          </p>
          <p class="tani__dritare">${ikona('nate')} Çdo natë ${orariINates.prej}–${orariINates.deri}</p>
        </div>
        <h2 class="tani__titull">Kush është kujdestare sonte në ${orari.komuna}</h2>
        <p class="tani__shpjegim">
          Barnatorja kujdestare ndërrohet çdo natë sipas rotacionit
          ${orari.projeksioni.gjatesiaECiklit}-ditor. Kur faqja hapet, kartela këtu tregon
          barnatoren e natës në vazhdim, adresën e saj dhe kohën e mbetur; deri atëherë,
          gjeje datën te orari i plotë më poshtë.
        </p>
        <div class="veprimet">
          <a class="buton buton--kryesor" href="#orari-plote">
            ${ikona('ora')} Orari i plotë natë për natë
          </a>
        </div>
      </section>

      <section class="orari-plote" id="orari-plote">
        <h2 class="titull-seksioni">Orari i plotë</h2>
        ${shpjegimiIOrarit()}
        ${tabelat}
      </section>

      <section class="barnatoret">${seksioniIBarnatoreve()}</section>
      ${njoftimiIProjeksionit()}
      ${seksioniIPyetjeve()}
      ${fundfaqja()}
    </main>
  `;
}
