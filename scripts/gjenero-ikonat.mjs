/**
 * Gjeneron ikonat PNG të PWA-së dhe imazhin e ndarjes, nga i njëjti motiv si
 * favicon-i: kryq i bardhë mbi fushë të kaltër.
 *
 * Përdorimi:  node scripts/gjenero-ikonat.mjs
 *
 * Nuk kërkon varësi — PNG-të shkruhen me dorë (IHDR/IDAT/IEND me deflate nga
 * zlib-i i Node-it), sepse për një kryq gjeometrik nuk vlen të shtohet Sharp.
 * Kjo do të thotë edhe se nuk ka si të vizatohet tekst: imazhi i ndarjes mban
 * vetëm shenjën, kurse titullin dhe përshkrimin i shkruan vetë shfletuesi nga
 * `og:title` e `og:description`.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const KALTER = [0x0f, 0x5a, 0xa8];
const BARDH = [0xff, 0xff, 0xff];
const HAPUR = [0x1d, 0xc4, 0x7d]; // jeshilja e „e hapur tani"

/**
 * Ikonat janë katrore e me sfond të plotë: sistemi operativ i pret vetë qoshet
 * sipas formës që përdor, prandaj s'ka nevojë t'i rrumbullakojmë ne.
 *
 * @param {number} madhesia  gjerësia/lartësia në piksela
 * @param {number} pjesaEKryqit  sa e gjerë është hapësira e kryqit ndaj kanavacës
 */
function vizatoIkonen(madhesia, pjesaEKryqit) {
  const hapesira = pjesaEKryqit * madhesia;
  const qendra = madhesia / 2;
  const gjysma = hapesira / 2; // gjysma e gjatësisë së krahut
  const trashesia = hapesira * (6 / 18) / 2; // raporti 6:18 si te favicon-i

  const rreshtat = [];
  for (let y = 0; y < madhesia; y++) {
    const rreshti = Buffer.alloc(1 + madhesia * 3); // bajti i filtrit + RGB
    for (let x = 0; x < madhesia; x++) {
      const brendaKryqit =
        (Math.abs(x - qendra) <= trashesia && Math.abs(y - qendra) <= gjysma) ||
        (Math.abs(y - qendra) <= trashesia && Math.abs(x - qendra) <= gjysma);

      const ngjyra = brendaKryqit ? BARDH : KALTER;
      const pozita = 1 + x * 3;
      rreshti[pozita] = ngjyra[0];
      rreshti[pozita + 1] = ngjyra[1];
      rreshti[pozita + 2] = ngjyra[2];
    }
    rreshtat.push(rreshti);
  }
  return Buffer.concat(rreshtat);
}

const crcTabela = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (const bajt of buf) c = crcTabela[(c ^ bajt) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function copa(tipi, tedhenat) {
  const gjatesia = Buffer.alloc(4);
  gjatesia.writeUInt32BE(tedhenat.length);
  const trupi = Buffer.concat([Buffer.from(tipi, 'ascii'), tedhenat]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(trupi));
  return Buffer.concat([gjatesia, trupi, crc]);
}

function png(gjeresia, lartesia, pikselat) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(gjeresia, 0);
  ihdr.writeUInt32BE(lartesia, 4);
  ihdr[8] = 8; // 8 bit për kanal
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    copa('IHDR', ihdr),
    copa('IDAT', deflateSync(pikselat, { level: 9 })),
    copa('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Imazhi që shfaqet kur lidhja ndahet në WhatsApp, Viber ose Facebook.
 *
 * Motivi është i njëjtë me ikonën e instaluar, që kartela në bisedë dhe ikona
 * në ekranin kryesor të njihen si një gjë e vetme. Fusha ka një kalim të lehtë
 * nga e kaltra e ndritshme te e thella, dhe në fund një vijë jeshile — ngjyra që
 * faqja përdor për „e hapur tani".
 */
function vizatoNdarjen(gjeresia, lartesia) {
  const qendraX = gjeresia / 2;
  const qendraY = lartesia / 2;
  const gjysma = lartesia * 0.29; // gjysma e gjatësisë së krahut
  const trashesia = gjysma * (6 / 18);
  const vija = Math.round(lartesia * 0.018); // vija jeshile në fund

  const rreshtat = [];
  for (let y = 0; y < lartesia; y++) {
    const rreshti = Buffer.alloc(1 + gjeresia * 3);
    // Kalimi vertikal: sipër më e ndritshme, poshtë më e thellë.
    const pjesa = y / lartesia;
    const sfondi = [
      Math.round(KALTER[0] + (0x18 - KALTER[0] * 0.08) * (1 - pjesa) - 4 * pjesa),
      Math.round(KALTER[1] + 0x12 * (1 - pjesa) - 8 * pjesa),
      Math.round(KALTER[2] + 0x14 * (1 - pjesa) - 10 * pjesa),
    ];

    for (let x = 0; x < gjeresia; x++) {
      const brendaKryqit =
        (Math.abs(x - qendraX) <= trashesia && Math.abs(y - qendraY) <= gjysma) ||
        (Math.abs(y - qendraY) <= trashesia && Math.abs(x - qendraX) <= gjysma);

      const ngjyra = y >= lartesia - vija ? HAPUR : brendaKryqit ? BARDH : sfondi;
      const pozita = 1 + x * 3;
      rreshti[pozita] = ngjyra[0];
      rreshti[pozita + 1] = ngjyra[1];
      rreshti[pozita + 2] = ngjyra[2];
    }
    rreshtat.push(rreshti);
  }
  return Buffer.concat(rreshtat);
}

const publiku = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(publiku, { recursive: true });

const ikonat = [
  // [emri, madhësia, gjerësia e kryqit ndaj kanavacës]
  ['ikona-192.png', 192, 0.56],
  ['ikona-512.png', 512, 0.56],
  // Maskable: kryq më i vogël, që të mbetet brenda zonës së sigurt 80% kur pritet.
  ['ikona-maskable-512.png', 512, 0.42],
  ['apple-touch-icon.png', 180, 0.56],
];

for (const [emri, madhesia, kryqi] of ikonat) {
  const skedari = join(publiku, emri);
  writeFileSync(skedari, png(madhesia, madhesia, vizatoIkonen(madhesia, kryqi)));
  console.log(`${emri}  ${madhesia}×${madhesia}`);
}

// 1200×630 është përmasa që pritet nga `og:image`.
const NDARJA = [1200, 630];
writeFileSync(join(publiku, 'ndarje.png'), png(...NDARJA, vizatoNdarjen(...NDARJA)));
console.log(`ndarje.png  ${NDARJA[0]}×${NDARJA[1]}`);
