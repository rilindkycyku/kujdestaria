/**
 * Gjeneron ikonat PNG të PWA-së nga i njëjti motiv si favicon-i: kryq i bardhë
 * mbi katror të kaltër.
 *
 * Përdorimi:  node scripts/gjenero-ikonat.mjs
 *
 * Nuk kërkon varësi — PNG-të shkruhen me dorë (IHDR/IDAT/IEND me deflate nga
 * zlib-i i Node-it), sepse për një kryq gjeometrik nuk vlen të shtohet Sharp.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const KALTER = [0x0f, 0x5a, 0xa8];
const BARDH = [0xff, 0xff, 0xff];

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

function png(madhesia, pikselat) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(madhesia, 0);
  ihdr.writeUInt32BE(madhesia, 4);
  ihdr[8] = 8; // 8 bit për kanal
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    copa('IHDR', ihdr),
    copa('IDAT', deflateSync(pikselat, { level: 9 })),
    copa('IEND', Buffer.alloc(0)),
  ]);
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
  writeFileSync(skedari, png(madhesia, vizatoIkonen(madhesia, kryqi)));
  console.log(`${emri}  ${madhesia}×${madhesia}`);
}
