# kujdestaria

Orari i kujdestarisë së barnatoreve për qytetin e Kaçanikut — faqe e vogël Vite që tregon
menjëherë **cila barnatore është kujdestare sot**, plus orarin e plotë sipas muajve.

## Zhvillimi

```bash
npm install
npm run dev       # serveri i zhvillimit
npm run build     # ndërton në dist/
npm run preview   # shikon ndërtimin
npm run gjenero   # rigjeneron src/data/orari-2026.json
```

Faqja është statike pas `npm run build` — `dist/` mund të vendoset kudo (GitHub Pages,
Netlify, Vercel, ose një server i thjeshtë).

## Të dhënat

Të gjitha të dhënat janë në [`src/data/orari-2026.json`](src/data/orari-2026.json), i
gjeneruar nga [`scripts/gjenero-orarin.mjs`](scripts/gjenero-orarin.mjs).

Burimi është njoftimi zyrtar i Komunës së Kaçanikut, `03Nr. 500/01-15606/26` i datës
29.06.2026 — [PDF-ja e skanuar][pdf], e publikuar te [shpalljet e komunës][shpalljet].
Dokumenti është skanim pa shtresë teksti, prandaj tabela është transkriptuar me dorë dhe
është kontrolluar rresht për rresht kundrejt skanimit.

### Rotacioni

Kujdestaria ndërrohet çdo ditë sipas një cikli 10-ditor:

| #   | Barnatorja | #   | Barnatorja |
| --- | ---------- | --- | ---------- |
| 1   | Flora      | 6   | Rigoni-2   |
| 2   | Liampharm  | 7   | Rigoni     |
| 3   | Rigoni-2   | 8   | Riga       |
| 4   | Rigoni     | 9   | Riga-2     |
| 5   | Dielli     | 10  | Flora      |

Flora, Rigoni dhe Rigoni-2 shfaqen dy herë në cikël, prandaj kanë nga dy ditë kujdestarie
për çdo 10 ditë.

### Orari

Dy orare të ndryshme, që nuk duhen ngatërruar:

| | Orari | Kush |
| --- | --- | --- |
| **Orari i rregullt** | 08:00–22:00 | të gjitha barnatoret |
| **Kujdestaria** | 22:00–08:00 | vetëm barnatorja kujdestare e atij dati |

Orari i rregullt **08:00–22:00** vlen gjatë tërë vitit: në sezonin veror sipas Rregullores
Komunale `01Nr.05-16-2609/15`, kurse në sezonin dimëror sipas Vendimit të Kryetarit
`01Nr.104/02-30047/22`, i cili e zgjat orarin dimëror nga 08:00–20:00 në 08:00–22:00.
Gjatë tij nuk ka barnatore të veçantë kujdestare — janë hapur të gjitha.

Kujdestaria fillon kur mbaron orari i rregullt: barnatorja e caktuar për një datë qëndron
e hapur **prej 22:00 të asaj date deri në 08:00 të nesërmen**. Kjo ka një pasojë që faqja
e mban parasysh: **pas mesnate kujdestare është ende barnatorja e datës së kaluar.** Në
ora 02:00 të 27.07 është e hapur barnatorja e 26.07, jo e 27.07 — prandaj
`kujdestariaTani()` në [`src/orari.js`](src/orari.js) nuk mjafton të kthejë
`kujdestariaPer(dataSot())`.

### Harta, adresa dhe telefoni

Çdo barnatore mund të ketë lidhje Google Maps, adresë dhe telefon. Vendosen te
`BARNATORET` në [`scripts/gjenero-orarin.mjs`](scripts/gjenero-orarin.mjs):

```js
const BARNATORET = {
  Flora: {
    harta: 'https://maps.app.goo.gl/xxxxxxxx',
    adresa: 'Rr. …, Kaçanik',
    telefoni: '+383 44 123 456',
  },
  // …
};
```

Pastaj `npm run gjenero`. Fushat e zbrazëta thjesht nuk shfaqen, prandaj mund të
plotësohen një nga një. Kur asnjë barnatore s'ka lidhje, seksioni „Barnatoret" fshihet
krejt.

Lidhjet kalojnë nga [`src/harta.js`](src/harta.js), që pranon vetëm `https:` dhe vetëm
hostet e Google Maps (`google.com`, `maps.google.com`, `maps.app.goo.gl`, `goo.gl`).
Çdo gjë tjetër nuk shfaqet dhe skripta e gjenerimit paralajmëron. Kjo sepse `href`-i
ndërtohet me varg teksti, kështu që një `javascript:` ose një host i ngjashëm
(`maps.app.goo.gl.dikush.com`) nuk kalon.

Si merret lidhja: hape vendin në Google Maps → **Share** → **Copy link**.

### Datat zyrtare dhe ato të projektuara

Dokumenti i publikuar mbulon vetëm **01.07.2026 – 31.08.2026**. Që faqja të mos mbetet
bosh çdo dy muaj, i njëjti rotacion 10-ditor është vazhduar me llogaritje deri më
**31.12.2026**. Këto ditë kanë `"zyrtare": false` në JSON dhe shënohen si
**„e projektuar"** në faqe.

> Projeksioni supozon që rotacioni vazhdon i pandërprerë. Nëse komuna e ndryshon radhën
> ose shton/heq një barnatore, projeksioni shtrembërohet. Kur del orari i ri te
> [shpalljet][shpalljet], përditëso `ROTACIONI`, `FILLIMI`, `FUNDI_ZYRTAR` dhe `FUNDI` në
> skriptën e gjenerimit dhe ekzekuto `npm run gjenero`.

### Struktura e JSON-it

```jsonc
{
  "periudha":    { "prej": "2026-07-01", "deri": "2026-12-31", "zyrtareDeri": "2026-08-31" },
  "orari": {
    "iRregullt":   { "prej": "08:00", "deri": "22:00" },  // të gjitha barnatoret
    "kujdestaria": { "prej": "22:00", "deri": "08:00" }   // vetëm kujdestarja
  },
  "rotacioni":   ["Flora", "Liampharm", "..."],
  "kujdestaria": [
    {
      "data": "2026-07-01",
      "dita": "E mërkurë",
      "barnatorja": "Flora",
      "pozitaNeCikel": 1,
      "sezoni": "veror",
      // nata që fillon më 01.07 në 22:00 dhe mbaron më 02.07 në 08:00
      "kujdestaria": { "prej": "22:00", "deri": "08:00", "mbaronMe": "2026-07-02" },
      "zyrtare": true
    }
  ]
}
```

[pdf]: https://kacanik.rks-gov.net/wp-content/uploads/2026/06/Orari-Korrik-Gusht-2026.pdf
[shpalljet]: https://kacanik.rks-gov.net/shpalljet/
