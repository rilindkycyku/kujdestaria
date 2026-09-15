# CLAUDE.md

Udhëzime për asistentët e IA-së që punojnë në këtë depo. Lexoje para se ta prekësh kodin.

Dokumentacioni i projektit është shqip, prandaj edhe ky skedar. Struktura, komentet, commit-et dhe
teksti në ekran janë shqip — mos e ndërro gjuhën.

## Çka është kjo

**kujdestaria** — një faqe e vetme që i përgjigjet një pyetjeje: *cila barnatore është e hapur tani
në Kaçanik*. Prej 22:00 deri në 08:00 një barnatore e komunës rri e hapur me radhë, sipas një
rotacioni 10-ditor. Orari zyrtar ekziston vetëm si PDF i skanuar te shpalljet e komunës; kjo faqe e
kthen atë në një përgjigje.

Tri gjëra e përcaktojnë çdo vendim këtu, dhe asnjëra nuk është e zakonshme për një faqe web:

1. **Nuk ka framework.** Vite për ndërtim, ndërfaqja është DOM i shkruar me dorë. Vetëm dy varësi:
   `vite` (dev) dhe `@vercel/analytics`. Mos shto framework, mos shto bibliotekë komponentësh.
2. **Nuk ka server dhe nuk ka rrjet në rrugën e përgjigjes.** Orari është JSON brenda paketës. Faqja
   hapet plotësisht pa internet — sepse ora kur duhet është edhe ora kur lidhja është më e dobët.
3. **Përdoruesi është dikush në ora 02:00.** Hierarkia është e prerë: emri i barnatores është
   elementi më i madh, „Hape në Maps" është buton i plotë, gjithçka tjetër vjen pas.

Arsyetimi i plotë pas zgjidhjeve është te **[`docs/vendimet.md`](docs/vendimet.md)** — lexoje para
se të ndryshosh ndërfaqen, SEO-në, provat ose service worker-in. README-ja tregon *çka* bën faqja;
`vendimet.md` tregon *pse ashtu*.

## Komandat

```bash
npm install
npm run dev       # serveri i zhvillimit
npm run build     # vite build && node scripts/parafaqja.mjs && node scripts/pergatit-sw.mjs
npm run preview
npm test          # node --test — 45 prova, pa framework provash
npm run gjenero   # rigjeneron src/data/orari-2026.json
npm run ikonat    # rigjeneron ikonat PNG dhe imazhin e ndarjes te public/
```

`npm test` para çdo commit-i. Nuk ka linter të konfiguruar.

**`npm run build` ka tri hapa dhe të tre janë të domosdoshëm.** `vite build` vetëm nuk mjafton: pa
`parafaqja.mjs` HTML-ja del me `<div id="app">` të zbrazët për robotët, dhe pa `pergatit-sw.mjs`
service worker-i nuk ka listë paracache-i. Nëse ndryshon skriptën e ndërtimit, mbaji të tre.

## Struktura

```
src/
  main.js                pikënisja në shfletues — ngjarjet dhe tiku i minutës
  faqja.js               markup-i, i përbashkët me parandërtimin (pa DOM, pa Date)
  koha.js                logjika e kohës — e ndarë që të provohet pa bundler
  orari.js               kush është kujdestare, netët në vijim, kontaktet
  skema.js               grafi schema.org (JSON-LD)
  veprimet.js            ndarja, instalimi, service worker-i
  harta.js               validimi i lidhjeve të Google Maps
  ikonat.js              ikonat SVG inline
  style.css
  data/orari-2026.json   orari i gjeneruar
  fonts/                 Quicksand (woff2 variabël) dhe licenca OFL

scripts/
  gjenero-orarin.mjs     ndërton orarin nga rotacioni dhe datat e dokumentit
  parafaqja.mjs          mbush dist/index.html, head-in, robots.txt dhe sitemap.xml
  pergatit-sw.mjs        shkruan VERSIONI dhe PARACACHE te dist/sw.js, pas ndërtimit
  gjenero-ikonat.mjs     ikonat PNG dhe imazhi i ndarjes

test/                    koha.test.mjs, orari-2026.test.mjs, seo.test.mjs,
                         tema.test.mjs, stili.test.mjs
docs/vendimet.md         arsyetimi pas zgjidhjeve
public/
  tema.js                tema e zgjedhur — vendoset para vizatimit, jashtë paketës
  sw.js, manifest.webmanifest, ikonat
```

## Rregullat e arkitekturës

### 1. `koha.js` nuk e njeh orarin, dhe kjo është me qëllim

`koha.js` nuk importon JSON dhe nuk varet nga të dhënat, pikërisht që `node --test` t'i ekzekutojë
provat drejtpërdrejt, pa bundler. Ajo është pjesa që gabon pa u dukur: nata kalon mesnatën, prandaj
**pas mesnate kujdestare është ende barnatorja e datës së djeshme**. Një gabim aty nuk e rrëzon
faqen — vetëm dërgon dikë te barnatorja e gabuar në ora 02:00.

Logjika e re e kohës shkon këtu, me prova. Mos fut `import` të të dhënave në këtë skedar.

### 2. `faqja.js` nuk guxon të prekë `document`, `navigator` as `new Date()`

I njëjti markup shkruhet dy herë: një herë nga shfletuesi dhe një herë nga `parafaqja.mjs` gjatë
ndërtimit. Prandaj rregulli është absolut — asnjë API i shfletuesit dhe asnjë „tani" në këtë skedar.

Kartela „tani" dhe „netët në vijim" **nuk parandërtohen fare**: HTML-ja shkruhet një herë dhe
lexohet muaj më vonë, prandaj çdo „tani" i ngrirë aty do të ishte gabim i sigurt. Sapo ngarkohet
skripta, `main.js` e zëvendëson përmbajtjen me pamjen e drejtpërdrejtë.

Titulli, përshkrimi dhe adresat dalin nga `TITULLI` / `PERSHKRIMI` te `faqja.js` dhe shkruhen te
`<head>`-i gjatë ndërtimit, që të mos mbetet periudhë e vjetër te rezultati i kërkimit.

### 3. Vizatimi sipas pjesëve, jo `innerHTML` i tërë

Kartela rifreskohet çdo minutë. Nëse rishkruhej `app.innerHTML` i tërë, çdo minutë do të humbte
rrëshqitja e tabelës, `<details>`-i i hapur dhe fokusi i tastierës. Prandaj skeleti vendoset një
herë dhe `cakto()` shkruan vetëm pjesën që ka ndryshuar, duke e kthyer fokusin mbi elementin me të
njëjtin `data-fokus`.

Ndërrimi bëhet **pikërisht në kufirin e minutës** (`tikuIMinutes`), jo 60 sekonda pas hapjes,
përndryshe numërimi rri i ngrirë sa mbushet intervali i parë.

Shiriti i muajve nuk rivizatohet kur ndërron muaji: përditësohet `aria-pressed`, dhe stili varet
nga ai atribut, prandaj fokusi mbetet mbi butonin e shtypur.

### 4. CSP-ja `style-src 'self'` — pa asnjë atribut `style`

Headers-at te [`vercel.json`](vercel.json) janë të rreptë: `default-src 'self'`, pa
`unsafe-inline` askund, `form-action 'none'`, `frame-ancestors 'none'`.

Kjo vendos një kufi praktik: **asnjë atribut `style` nuk kalon**, prandaj vlerat dinamike vizatohen
me SVG, ku gjerësia është *atribut* i `<rect>`, jo stil. Kështu vizatohet shiriti i natës.

JSON-LD-ja kalon sepse është bllok të dhënash, jo skriptë. Nëse shton diçka që kërkon stil inline
ose skriptë të jashtme, zgjidhja nuk është ta zbutësh CSP-në.

Ikonat janë SVG inline te `ikonat.js`, jo emoji: emoji-t vizatohen nga fonti i sistemit, dalin me
ngjyra e madhësi të ndryshme dhe nuk e marrin ngjyrën e tekstit përreth.

### 5. Orari është i gjeneruar — mos e redakto JSON-in me dorë

`src/data/orari-2026.json` del nga `scripts/gjenero-orarin.mjs`. Kur komuna publikon orarin e ri te
[shpalljet](https://kacanik.rks-gov.net/shpalljet/), përditëso konstantet `ROTACIONI`, `FILLIMI`,
`FUNDI_ZYRTAR` dhe `FUNDI` te ajo skriptë, pastaj `npm run gjenero` dhe `npm test`.

Rregulli i `zyrtare`: dokumenti mbulon vetëm një periudhë (tani deri më `FUNDI_ZYRTAR`); pjesa tjetër
është i njëjti rotacion i vazhduar me llogaritje, me `"zyrtare": false`, dhe faqja e shënon
**„e projektuar"**. Ky dallim duhet të mbetet i dukshëm — orari është transkriptuar me dorë nga një
skanim pa shtresë teksti.

### 6. Paracache-i shkruhet pas ndërtimit

Skedarët te `/assets/` kanë hash në emër, prandaj `sw.js` nuk mund t'i dijë paraprakisht.
`pergatit-sw.mjs` i zëvendëson `VERSIONI` dhe `PARACACHE` te `dist/sw.js` pas ndërtimit. Versioni
është hash i përmbajtjes, që një deploy pa ndryshime të mos e zbrazë cache-in kot.

Strategjia: navigimet **rrjeti i pari** me kthim te kopja e ruajtur (orari i ri merret sapo ka
lidhje), gjithçka tjetër **cache-i i pari** (emrat me hash nuk vjetrohen gabimisht).

`robots.txt` dhe `sitemap.xml` gjenerohen gjatë ndërtimit dhe **nuk hyjnë në paracache** — i lexojnë
vetëm robotët.

### 7. Butoni i instalimit shfaqet gjithmonë

Shfaqet kudo, veç kur faqja është tashmë e instaluar (`display-mode: standalone`, ose
`navigator.standalone` në iOS). Më parë varej nga `beforeinstallprompt` dhe në Safari të kompjuterit,
në Firefox dhe në Chrome-in që s'e kishte nisur ende ngjarjen nuk dukej fare — dhe puna pa internet,
që është arsyeja kryesore e faqes, mbetej e pazbuluar. Kur ngjarja mungon, shpalosen udhëzimet e
platformës (`platformaEInstalimit()` → `ios | android | kompjuter`), me `aria-expanded` që ndjek
gjendjen.

### 8. Tema vendoset para vizatimit, prandaj rri jashtë paketës

Faqja e ndjek temën e sistemit si më parë; shiriti te kreu i jep përdoruesit tri zgjedhje —
sipas sistemit, dritë, terr — dhe zgjedhja ruhet te `localStorage`.

Zgjedhja shkon te `data-tema` i `<html>` nga [`public/tema.js`](public/tema.js), një skriptë
e zakonshme e ngarkuar **bllokuese** te `<head>`-i, jashtë paketës së Vite-s. Po ta bënte
`main.js` — modul, pra i shtyrë — faqja do të ndizej një çast me temën e sistemit: për këdo
që e ka zgjedhur terrin, një ndezje e bardhë në ora 02:00. Prandaj aty rri e gjithë sjellja
e temës: leximi, ruajtja, butonat dhe `media`-ja e `<meta name="theme-color">`. Mos e shto
`defer`, mos e bëj modul dhe mos e zhvendos para `theme-color`-ëve që i lexon.

Paleta e natës rri **një herë të vetme** te tokenat `--n-*` dhe ndizet nga dy rregulla — një
për sistemin (`:root:not([data-tema='drite'])`) dhe një për zgjedhjen (`:root[data-tema='terr']`).
CSS-ja nuk e ndan dot një bllok mes një `@media`-je dhe një përzgjedhësi, prandaj përsëritet
lista e emrave, kurrë vlerat; `test/tema.test.mjs` i mban të dyja listat të njëjta e të plota.

### 9. Fonti rri brenda paketës, dhe sipërfaqet nuk kanë kalime

Fonti është **Quicksand**, një woff2 variabël (300–700, latin) te `src/fonts/`, i lidhur me
`@font-face` te `style.css`. Mos e zëvendëso me Google Fonts: CSP-ja është `font-src 'self'`
dhe faqja duhet të hapet pa internet. Quicksand nuk ka peshë mbi 700 — mos shkruaj `800`.
Numrat mbeten te `--shkronja-numrat`, që orët e datat të rreshtohen te tabela.

Asnjë `gradient` te CSS-i dhe asnjë `<linearGradient>` te SVG-të: butoni kryesor, vija e
kartelës, muaji i shtypur, shenja e faqes dhe ikonat e gjeneruara mbushen me një ngjyrë të
vetme. Cian dhe smerald kanë nga një kuptim (e caktuar / e hapur tani) dhe një sipërfaqe që
i përzien nuk thotë asnjërën.

## Provat

`node --test`, pa asnjë varësi. Provat vendosin `TZ = Europe/Belgrade`, që të dalin njësoj në çdo
makinë.

| Skedari | Çka mbulon |
| --- | --- |
| `test/koha.test.mjs` | kufijtë (21:59 → 22:00 → 00:00 → 07:59 → 08:00), nata që kalon fundvitin, ndërrimi i orës verore, dhe një kalim mbi të 1440 minutat që kontrollon `kaluar + mbeten = gjatësia` |
| `test/orari-2026.test.mjs` | të dhënat e gjeneruara: data të njëpasnjëshme, dita e javës, `mbaronMe` një ditë pas, rotacioni sipas radhës së shpallur, flamuri `zyrtare`, lidhjet e hartave |
| `test/seo.test.mjs` | HTML-ja e gatshme i mban të gjitha netët dhe asnjë „tani" të ngrirë; JSON-LD-ja del e vlefshme; çdo përgjigje e `FAQPage`-it shfaqet fjalë për fjalë edhe në faqe |
| `test/stili.test.mjs` | fonti vjen nga vetë paketa me `font-display: swap`, asnjë peshë mbi 700, dhe asnjë kalim te CSS-i, te SVG-të e te ikonat |
| `test/tema.test.mjs` | të dyja rrugët e natës kalojnë të njëjtat tokena; `color-scheme` ndjek zgjedhjen; shtypja mbetet e bardhë edhe me terrin e zgjedhur; `tema.js` mbetet skriptë bllokuese pa `defer` e pa module; butonat kanë emër të lexueshëm |

Logjika e re shkon me prova. Një `npm run gjenero` i gabuar duhet të bjerë te provat, jo te faqja.

## Aksesueshmëria dhe ekranet e vogla

- Të gjitha çiftet e tekstit kalojnë **WCAG AA** në dritë e në terr; më i ngushti është 4.63:1.
- Butonat e temës dallohen nga `aria-pressed`, jo vetëm nga ngjyra, dhe secili ka emrin e vet
  për lexuesat e ekranit („Sipas sistemit", „E çelët", „E errët").
- Elementet që klikohen kanë `--kufiri-veprues` (≥3:1 sipas WCAG 1.4.11), kurse `--kufiri` është
  vetëm dekorativ. Mos e përdor kufirin dekorativ për një kontroll.
- Nën 30rem dita e javës shkurtohet („E mërkurë" → „Mër") në vend që të fshihet — tabela mbetet e
  plotë edhe në 320px.
- **Mbi 62rem faqja hapet te 72rem dhe ndahet në dy shtylla** (`.dyshja`): netët në vijim majtas,
  tabela e muajit djathtas, sepse ajo e do gjerësinë. Ndarja rri mes dy seksioneve që janë ngjitur
  edhe ashtu, prandaj radha e leximit te telefoni nuk ndryshon fare. Kartela „tani" mbetet e tërë
  gjerësia mbi to — ajo është përgjigjja. Grupimi bëhet te `skeleti()` i `main.js`; parandërtimi nuk
  e ka fare atë shtyllë, sepse netët në vijim nuk parandërtohen (rregulli 2).
- `env(safe-area-inset-*)` me `viewport-fit=cover` për pamjen e instaluar. Ka edhe stil për shtypje.
- Numërimi thotë **kujdestaria** mbaron/fillon, jo barnatorja mbyllet/hapet: në ora 08:00 barnatorja
  nuk mbyllet, kalon në orarin e rregullt.

## Gjëra që të zënë ngushtë

- **Domeni rri si `DOMENI` te `parafaqja.mjs`**, jo te `VERCEL_PROJECT_PRODUCTION_URL` — ajo kthen
  adresën `*.vercel.app` nëse domeni me emër nuk është i pari te projekti, dhe një `canonical` i
  tillë do t'ia kalonte peshën e kërkimit adresës së gabuar. Për një kopje tjetër përdor
  `KUJDESTARIA_BAZA`.
- Teksti te `index.html` është **vetëm rezervë për `npm run dev`** — te prodhimi e mbishkruan
  `parafaqja.mjs`.
- Pyetjet e shpeshta nuk janë zbukurim: i njëjti tekst shkon te `FAQPage` i grafit dhe te faqja,
  sepse Google-i i pranon përgjigjet vetëm nëse duken edhe në faqe. Burimi është një i vetëm
  (`pyetjet()` te `faqja.js`) dhe një provë e mban të lidhur.
- Te grafi schema.org **asgjë nuk shpiket**: fusha që nuk dihet thjesht nuk shkruhet.
- Adresa e kontaktit për gabime te orari rri si `AUTORI` te `faqja.js`.
- `@vercel/analytics` injektohet te `main.js` — kujdes që CSP-ja ta lejojë atë që i duhet nëse e
  ndryshon.
