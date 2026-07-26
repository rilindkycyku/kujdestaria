# kujdestaria

Orari i kujdestarisë së barnatoreve për qytetin e Kaçanikut — faqe e vogël Vite që tregon
menjëherë **cila barnatore është kujdestare tani**, sa i ka mbetur kujdestarisë, si
shkohet atje, plus orarin e plotë sipas muajve.

## Zhvillimi

```bash
npm install
npm run dev       # serveri i zhvillimit
npm run build     # ndërton në dist/ dhe përgatit sw.js
npm run preview   # shikon ndërtimin
npm run gjenero   # rigjeneron src/data/orari-2026.json
npm run ikonat    # rigjeneron ikonat PNG te public/
```

Faqja është statike pas `npm run build` — `dist/` mund të vendoset kudo (GitHub Pages,
Netlify, Vercel, ose një server i thjeshtë).

## Ndërfaqja

Rasti i përdorimit është një person në ora 02:00 me pyetjen „ku shkoj tani". Prandaj
hierarkia është e prerë: emri i barnatores është elementi më i madh në ekran, **Hape në
Maps** është buton i plotë me ngjyrën e gjendjes, dhe orari i plotë me bazën ligjore vjen
pas, me kontrast më të ulët. Tema e errët nuk është shtojcë — është gjendja e pritur në
atë orë.

### Kartela e gjendjes

Kartela ka tri gjendje, dhe ngjyra e saj (`--gjendja`) i ndjek:

| Gjendja | Kur | Ngjyra | Teksti |
| --- | --- | --- | --- |
| `tani--nate` | 22:00–08:00, kujdestaria në fuqi | jeshile | „E hapur tani" + sa i ka mbetur |
| `tani--dite` | 08:00–22:00, orari i rregullt | e kaltër | „Kujdestare sonte" + pas sa kohe fillon |
| `tani--jashte` | data jashtë periudhës së orarit | e kaltër | shpjegim + lidhja te shpalljet |

Numërimi i kohës thotë **kujdestaria** mbaron/fillon, jo barnatorja mbyllet/hapet — në
ora 08:00 barnatorja nuk mbyllet, kalon në orarin e rregullt bashkë me të gjitha të
tjerat. Shiriti nën tekst tregon sa e ka kaluar nata rrugën prej 22:00 në 08:00.

Ndërrimi bëhet pikërisht në kufirin e minutës (`tikuIMinutes`), jo 60 sekonda pas hapjes,
përndryshe numërimi qëndron i ngrirë sa mbushet intervali i parë.

### Vizatimi sipas pjesëve

Kartela rifreskohet çdo minutë. Nëse do të rishkruhej `app.innerHTML` i tërë — si më parë
— çdo minutë do të humbte rrëshqitja e tabelës, `<details>`-i i hapur dhe fokusi i
tastierës. Prandaj skeleti vendoset një herë dhe `cakto()` shkruan vetëm pjesën që ka
ndryshuar vërtet, duke kthyer fokusin mbi elementin me të njëjtin `data-fokus`. Në një
minutë të zakonshme ndryshon vetëm kartela e gjendjes.

Ndërrimi i muajit nuk e rivizaton shiritin e muajve: përditësohet `aria-pressed`, dhe
stili i butonit aktiv varet nga ai atribut, prandaj fokusi mbetet mbi butonin e shtypur.

### Stilet dhe CSP-ja

CSP-ja e faqes është `style-src 'self'`, pa `unsafe-inline` — asnjë atribut `style` nuk
kalon. Kjo e vendos një kufi: gjerësia e shiritit të natës është vlerë dinamike, prandaj
vizatohet me SVG, ku gjerësia është **atribut** i `<rect>`, jo stil. E provuar me
pikërisht headers-at e [`vercel.json`](vercel.json).

Ikonat janë SVG inline te [`src/ikonat.js`](src/ikonat.js) e nuk janë emoji: emoji-t
vizatohen nga fonti i sistemit, dalin me ngjyra e madhësi të ndryshme sipas pajisjes dhe
nuk marrin ngjyrën e tekstit përreth.

### Ekranet e vogla

Nën 30rem dita e javës shkurtohet („E mërkurë" → „Mër") në vend që të fshihet, kështu
tabela mbetet e plotë edhe në 320px. Shiriti i muajve rrëshqet horizontalisht dhe hapet
te muaji aktual. `env(safe-area-inset-*)` bashkë me `viewport-fit=cover` mbajnë faqen
larg qosheve të rrumbullakuara kur ekzekutohet e instaluar. Ka edhe stil për shtypje.

### Njoftimi për gabim

Orari transkriptohet me dorë nga një skanim, dhe rotacioni pas 31.08.2026 është i
llogaritur — prandaj një datë e shkëmbyer është e mundshme. Fundfaqja ka një kartelë me
lidhjen te [kontaktet e autorit](https://www.rilindkycyku.dev/contacts), që personi i
cili e vë re gabimin të ketë ku ta thotë pa hapur GitHub. Adresa ndryshohet te `AUTORI`
në [`src/main.js`](src/main.js).

## PWA — instalim dhe punë pa internet

Faqja instalohet në ekranin kryesor dhe punon plotësisht pa internet. Kjo e fundit është
arsyeja kryesore: orari është i futur brenda paketës JS, prandaj pasi faqja hapet një
herë, dikush që kërkon barnatoren kujdestare natën me sinjal të dobët e merr përgjigjen
gjithsesi.

| Skedari | Roli |
| --- | --- |
| [`public/manifest.webmanifest`](public/manifest.webmanifest) | emri, ikonat, `display: standalone` |
| [`public/sw.js`](public/sw.js) | service worker-i |
| [`scripts/pergatit-sw.mjs`](scripts/pergatit-sw.mjs) | shkruan listën e paracache-it pas ndërtimit |
| [`scripts/gjenero-ikonat.mjs`](scripts/gjenero-ikonat.mjs) | ikonat PNG, pa varësi |

**Paracache-i shkruhet pas ndërtimit, jo me dorë.** Skedarët te `/assets/` kanë hash në
emër, prandaj `sw.js` nuk mund t'i dijë paraprakisht. `npm run build` e thërret
`pergatit-sw.mjs`, i cili zëvendëson `VERSIONI` dhe `PARACACHE` te `dist/sw.js`.
Pa këtë hap faqja do të hapej pa internet vetëm nga vizita e dytë e tutje — sepse gjatë
vizitës së parë service worker-i ende nuk ka marrë kontrollin dhe s'ka çka të ruajë.
Versioni është hash i përmbajtjes, prandaj një deploy pa ndryshime nuk e zbraz cache-in
kot.

Strategjia: navigimet janë **rrjeti i pari** me kthim te kopja e ruajtur (orari i ri
merret sapo ka lidhje), kurse gjithçka tjetër është **cache-i i pari** (emrat me hash
nuk vjetrohen kurrë gabimisht).

### Butoni „Shto në ekran"

Butoni shfaqet **kudo**, veç kur faqja është tashmë e instaluar (`display-mode:
standalone`, ose `navigator.standalone` në iOS). Më parë varej nga
`beforeinstallprompt`, prandaj në Safari të kompjuterit, në Firefox dhe në Chrome-in që
ende nuk e ka nisur ngjarjen nuk shfaqej fare — dhe puna pa internet, që është arsyeja
kryesore e kësaj faqeje, mbetej e pazbuluar.

Kur ngjarja ekziston, butoni hap ftesën e shfletuesit. Kur nuk ekziston, shpalos
udhëzimet e platformës (`platformaEInstalimit()` → `ios | android | kompjuter`) dhe
`aria-expanded` ndjek gjendjen:

| Platforma | Udhëzimi |
| --- | --- |
| iOS | Share në shiritin e Safari-t → Add to Home Screen |
| Android | menyja (⋮) → Install app / Add to Home screen |
| Kompjuter | ikona e instalimit te shiriti i adresës, ose menyja (⋮) → Install |

### Butoni „Ndaje"

Përdor `navigator.share()` kur ekziston; përndryshe e kopjon lidhjen në clipboard dhe e
thotë atë. Teksti i ndarë përmban edhe përgjigjen, jo vetëm lidhjen — p.sh. „Barnatorja
kujdestare në Kaçanik, nata 26.07 → 27.07: Rigoni-2 (BK Center), e hapur 22:00–08:00."
Nata shënohet me datë sepse „tani" bëhet i pasaktë sapo mesazhi lexohet një orë më vonë.

## Vendosja në Vercel

[`vercel.json`](vercel.json) e mbulon konfigurimin; Vercel-i e njeh vetë projektin si
Vite, prandaj mjafton ta lidhësh depon dhe të bësh deploy.

**Cache-i** është pjesa që ka rëndësi këtu. Skedarët te `/assets/` kanë emër me hash,
prandaj ruhen një vit si `immutable`. `index.html` shërbehet me `must-revalidate`, që
kur të dalë orari i ri të mos mbetet askush me faqen e vjetër në cache.

**Headers-at e sigurisë** vendosen për të gjitha rrugët: CSP (`default-src 'self'`, pa
`unsafe-inline`), `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` dhe
`Permissions-Policy`. Faqja nuk ka skripta as stile inline, prandaj CSP-ja e rreptë
kalon pa përjashtime — e provuar në Chromium me pikërisht këto headers.

### Analytics

[Vercel Analytics](https://vercel.com/docs/analytics) thirret me `inject()` në fund të
[`src/main.js`](src/main.js). Duhet aktivizuar edhe te paneli i projektit në Vercel
(**Analytics → Enable**), përndryshe grumbullimi nuk ndodh.

Skripta shërbehet nga vetë domeni (`/_vercel/insights/script.js`), prandaj hyn te
`script-src 'self'` dhe nuk kërkon lirim në CSP. Jashtë Vercel-it — në `npm run dev`,
`npm run preview` ose ndonjë host tjetër — kërkesa kthen 404 dhe thjesht injorohet;
faqja punon njësoj.

Për Speed Insights mjafton `npm i @vercel/speed-insights` dhe një `injectSpeedInsights()`
po aty; nuk është shtuar sepse nuk u kërkua.

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
