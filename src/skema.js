/**
 * Të dhënat e strukturuara (schema.org, JSON-LD) që shkruhen te `<head>`-i gjatë
 * ndërtimit nga [`scripts/parafaqja.mjs`](../scripts/parafaqja.mjs).
 *
 * HTML-ja i thotë njeriut se cila barnatore është hapur; kjo ia thotë të njëjtën
 * gjë makinës: që Google-i ta dijë se `Flora` është një `Pharmacy` në Kaçanik me
 * orar `08:00–22:00`, dhe se pyetja „a ka barnatore hapur natën" ka përgjigje në
 * këtë faqe. Pa këtë, i mbetet ta hamendësojë nga teksti.
 *
 * Rregulli: asgjë këtu nuk shpiket. Çdo fushë del nga
 * [`data/orari-2026.json`](data/orari-2026.json) ose nga dokumenti zyrtar; ajo
 * që nuk dihet — koordinatat e sakta të një barnatoreje, p.sh. — thjesht nuk shkruhet.
 */
import { orari, tëGjithaBarnatoret } from './orari.js';
import { AUTORI, PERSHKRIMI, TITULLI, pyetjet } from './faqja.js';

const { iRregullt, kujdestaria: orariINates } = orari.orari;

/** Emrat e shkurtër janë të vlefshëm brenda `@context: https://schema.org`. */
const DITET_E_JAVES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/** Faqja zyrtare e komunës — burimi i orarit dhe i vendimeve që e rregullojnë. */
const KOMUNA = new URL(orari.burimet.shpalljet).origin;

/** `'Rigoni-2'` → `'rigoni-2'`, që `@id`-të të mos varen nga shkronjat e mëdha e nga hapësirat. */
function celes(emri) {
  return emri
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Heq fushat pa vlerë, që të mos dalë `"telephone": null` te barnatoret pa telefon. */
function pastro(vlera) {
  if (Array.isArray(vlera)) return vlera.map(pastro).filter((v) => v !== undefined);
  if (vlera === null || vlera === undefined || vlera === '') return undefined;
  if (typeof vlera !== 'object') return vlera;

  const dalja = {};
  for (const [emri, v] of Object.entries(vlera)) {
    const i = pastro(v);
    if (i !== undefined) dalja[emri] = i;
  }
  return Object.keys(dalja).length > 0 ? dalja : undefined;
}

/**
 * Grafi i plotë i faqes.
 *
 * `baza` është domeni i faqes, p.sh. `https://kujdestaria.example`. Kur nuk dihet
 * (ndërtim lokal), `@id`-të mbeten fragmente relative — JSON-LD-ja i zgjidh
 * kundrejt adresës ku lexohet faqja, prandaj dalin të sakta kudo ku vendoset.
 */
export function skema({ baza = null, dataENdryshimit = null } = {}) {
  const rrenja = baza ? baza.replace(/\/$/, '') : '';
  const id = (fragmenti) => `${rrenja}/${fragmenti}`;
  const faqja = baza ? `${rrenja}/` : undefined;

  const orarIRregullt = {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: DITET_E_JAVES,
    opens: iRregullt.prej,
    closes: iRregullt.deri,
  };

  const barnatoret = tëGjithaBarnatoret().map((b) => ({
    '@type': 'Pharmacy',
    '@id': id(`#barnatorja-${celes(b.emri)}`),
    name: b.emri,
    address: {
      '@type': 'PostalAddress',
      streetAddress: b.adresa ?? undefined,
      addressLocality: orari.komuna,
      addressCountry: 'XK',
    },
    telephone: b.telefoni ?? undefined,
    hasMap: b.harta ?? undefined,
    areaServed: { '@id': id('#qyteti') },
    // Orari i rregullt vlen për të gjitha barnatoret; netët e kujdestarisë
    // ndërrohen çdo natë sipas rotacionit dhe shkruhen te tabela e faqes, jo këtu —
    // një listë me qindra data do ta fryjë faqen pa i dhënë asgjë lexuesit.
    openingHoursSpecification: [orarIRregullt],
  }));

  return pastro({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': id('#uebfaqja'),
        url: faqja,
        name: `Kujdestaria e barnatoreve — ${orari.komuna}`,
        description: PERSHKRIMI,
        inLanguage: 'sq',
        creator: { '@id': id('#autori') },
        about: { '@id': id('#sherbimi') },
      },
      {
        '@type': ['WebPage', 'FAQPage'],
        '@id': id('#faqja'),
        url: faqja,
        name: TITULLI,
        description: PERSHKRIMI,
        inLanguage: 'sq',
        isPartOf: { '@id': id('#uebfaqja') },
        about: { '@id': id('#sherbimi') },
        mentions: barnatoret.map((b) => ({ '@id': b['@id'] })),
        isBasedOn: { '@id': id('#dokumenti') },
        dateModified: dataENdryshimit ?? undefined,
        primaryImageOfPage: baza ? { '@id': id('#imazhi') } : undefined,
        // Pjesët që i lexon me zë një asistent kur pyetet kush është kujdestare tani.
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['.tani__emri', '.tani__dritare', '.koha__rreshti'],
        },
        mainEntity: pyetjet().map(({ pyetja, pergjigjja }) => ({
          '@type': 'Question',
          name: pyetja,
          acceptedAnswer: { '@type': 'Answer', text: pergjigjja },
        })),
      },
      {
        '@type': 'GovernmentService',
        '@id': id('#sherbimi'),
        name: `Kujdestaria e barnatoreve në ${orari.komuna}`,
        alternateName: 'Barnatorja kujdestare e natës',
        description:
          `Çdo natë prej ora ${orariINates.prej} deri në ora ${orariINates.deri} një barnatore e ` +
          `Komunës së ${orari.komunaGjinore} qëndron e hapur me radhë, sipas një rotacioni ` +
          `${orari.projeksioni.gjatesiaECiklit}-ditor.`,
        serviceType: 'Kujdestari farmaceutike',
        provider: { '@id': id('#komuna') },
        areaServed: { '@id': id('#qyteti') },
        audience: { '@type': 'Audience', audienceType: `Banorët e Komunës së ${orari.komunaGjinore}` },
        availableChannel: {
          '@type': 'ServiceChannel',
          name: 'Orari i kujdestarisë online',
          serviceUrl: faqja,
        },
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: DITET_E_JAVES,
          opens: orariINates.prej,
          closes: orariINates.deri,
        },
        provides: barnatoret.map((b) => ({ '@id': b['@id'] })),
      },
      {
        '@type': 'GovernmentOrganization',
        '@id': id('#komuna'),
        name: `Komuna e ${orari.komunaGjinore}`,
        url: KOMUNA,
        areaServed: { '@id': id('#qyteti') },
        subOrganization: {
          '@type': 'GovernmentOffice',
          '@id': id('#drejtoria'),
          name: orari.institucioni,
          parentOrganization: { '@id': id('#komuna') },
        },
      },
      {
        '@type': 'City',
        '@id': id('#qyteti'),
        name: orari.komuna,
        address: { '@type': 'PostalAddress', addressLocality: orari.komuna, addressCountry: 'XK' },
      },
      {
        // Dokumenti i skanuar nga i cili është transkriptuar orari — prejardhja e
        // të dhënave, që kushdo (njeri a makinë) ta verifikojë te burimi.
        '@type': 'CreativeWork',
        '@id': id('#dokumenti'),
        name: orari.titulli,
        identifier: orari.referenca,
        datePublished: orari.dataEDokumentit,
        url: orari.burimet.dokumenti,
        encodingFormat: 'application/pdf',
        inLanguage: 'sq',
        publisher: { '@id': id('#komuna') },
        author: { '@type': 'Person', name: orari.nenshkroi.emri, jobTitle: orari.nenshkroi.pozita },
        temporalCoverage: `${orari.periudha.prej}/${orari.periudha.zyrtareDeri}`,
      },
      {
        '@type': 'Person',
        '@id': id('#autori'),
        name: AUTORI.emri,
        url: AUTORI.faqja,
      },
      baza
        ? {
            '@type': 'ImageObject',
            '@id': id('#imazhi'),
            url: `${rrenja}/ndarje.png`,
            contentUrl: `${rrenja}/ndarje.png`,
            width: 1200,
            height: 630,
            caption: 'Kryqi i barnatores mbi fushë të kaltër',
          }
        : undefined,
      ...barnatoret,
    ],
  });
}
