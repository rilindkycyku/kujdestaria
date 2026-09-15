# Vendimet

Arsyetimi pas zgjidhjeve te [kujdestaria](../README.md) — pse kartela rifreskohet
sipas pjesëve, pse shiriti vizatohet me SVG, pse orari shkruhet brenda HTML-së, dhe
çka mbulojnë provat. README-ja tregon çka bën faqja; kjo tregon pse ashtu.

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
pikërisht headers-at e [`vercel.json`](../vercel.json).

Ikonat janë SVG inline te [`src/ikonat.js`](../src/ikonat.js) e nuk janë emoji: emoji-t
vizatohen nga fonti i sistemit, dalin me ngjyra e madhësi të ndryshme sipas pajisjes dhe
nuk marrin ngjyrën e tekstit përreth.

### Fonti dhe sipërfaqet

Fonti është **Quicksand**, e paketuar brenda faqes — jo nga Google Fonts. CSP-ja është
`font-src 'self'`, dhe faqja duhet të hapet edhe pa internet në ora 02:00: një font i
jashtëm do të ishte një kërkesë drejt një domeni tjetër pikërisht atëherë kur lidhja është
më e dobët. Prandaj një skedar i vetëm variabël (300–700, vetëm nënbashkësia latine,
28 kB), i futur te paracache-i si gjithçka tjetër, me `font-display: swap` që teksti të
lexohet menjëherë me fontin e sistemit derisa fonti të vijë. Licenca SIL OFL rri te
[`src/fonts/OFL.txt`](../src/fonts/OFL.txt).

Quicksand nuk ka peshë mbi 700, prandaj titujt që më parë ishin 800 janë 700 — një peshë e
padeklaruar do të shtypej gjithsesi te 700. Dallimi mes niveleve vjen nga madhësia, hapësira
e shkronjave dhe ngjyra. Orët e datat mbeten te `--shkronja-numrat` (font me gjerësi të
njëjtë): te tabela ato duhet të rreshtohen kolonë më kolonë.

Sipërfaqet mbushen me **një ngjyrë të vetme, pa kalime**. Kalimi smerald→cian i dikurshëm —
te butoni kryesor, te vija e kartelës, te muaji i shtypur, te shenja e faqes dhe te ikonat e
gjeneruara — i përzinte pikërisht dy ngjyrat që te kjo faqe kanë nga një kuptim: cian është
kujdestaria e caktuar, smerald ajo që është e hapur tani. Mbi një vijë 3-pikselëshe ose mbi
një buton, përzierja nuk lexohej si kalim, por si ngjyrë e papërcaktuar. Bashkë me kalimet
ranë edhe dy shkëlqimet dekorative (ai i sfondit dhe ai pas tekstit të kartelës), që ishin
gradient-e gjithashtu; hijet mbeten, sepse ato thonë lartësi, jo ngjyrë.

### Ekranet e vogla

Nën 30rem dita e javës shkurtohet („E mërkurë" → „Mër") në vend që të fshihet, kështu
tabela mbetet e plotë edhe në 320px. Shiriti i muajve rrëshqet horizontalisht dhe hapet
te muaji aktual. `env(safe-area-inset-*)` bashkë me `viewport-fit=cover` mbajnë faqen
larg qosheve të rrumbullakuara kur ekzekutohet e instaluar. Ka edhe stil për shtypje.

### Ekranet e mëdha

Faqja u shkrua për një telefon në ora 02:00, dhe ajo mbetet matja e parë. Por e njëjta
adresë hapet edhe nga një tabletë a një kompjuter, dhe atje një kolonë 47rem në mes të
ekranit linte dy pëllëmbë të zbrazëta anash dhe e shtynte tabelën një ekran poshtë —
pikërisht atë që dikush e hapi faqen ta shihte.

Mbi 62rem faqja hapet te 72rem dhe tri seksione ndahen në dy shtylla: netët në vijim dhe
barnatoret te shtylla e ngushtë, tabela e muajit te ajo e gjera, sepse tabela e do
gjerësinë dhe listat jo. Barnatoret hyjnë atje sepse tabela e një muaji është tridhjetë
rreshta e gjatë kurse netët katër kartela — pa to, shtylla e majtë mbaronte pas një të
pestës së lartësisë dhe pjesa tjetër rrinte e zbrazët krah saj. Vendosja bëhet me rrjet
(`grid-row`) e jo me radhë te HTML-ja, prandaj te telefoni radha mbetet ajo që ishte:
netët, orari, barnatoret. Ndarja bëhet mes dy seksioneve që rrinë ngjitur edhe ashtu (`.dyshja` te `skeleti()`),
prandaj radha e leximit nuk ndryshon aspak: sapo shtyllat bien njëra nën tjetrën, faqja
del pikërisht ajo e dikurshmja. Pyetjet e shpeshta dalin dy për rresht me të njëjtin
kufi, dhe barnatoret e kishin këtë sjellje që nga fillimi (`auto-fit`).

Kartela «tani» mbetet e tërë gjerësia mbi to. Ajo është përgjigjja e faqes, dhe
përgjigjja nuk ndan ekran me asnjë.

### Kontrasti

Të gjitha çiftet e tekstit kalojnë WCAG AA në dritë e në terr; më i ngushti është pilula
jeshile e natës me 4.63:1 dhe teksti i zbehtë mbi sfond me 5.29:1.

Kufijtë e kartelave janë vija të holla dekorative (`--kufiri`), kurse elementet që
klikohen kanë `--kufiri-veprues` — 3.6:1 mbi të bardhën dhe 3.2:1 mbi sfondin e faqes,
sepse WCAG 1.4.11 kërkon 3:1 për të dallohet një kontroll. Butonat me vetëm një vijë të
holluar dukeshin të pandashëm nga sfondi.

### Tema

Faqja e ndjek temën e sistemit, si më parë. Por sistemi jo gjithnjë e thotë të vërtetën për
dritën përreth: një telefon i mbetur në temën e errët në mesditë, ose një ekran i bardhë i
hapur në ora 02:00. Prandaj kreu ka tri butona — **sipas sistemit** (parazgjedhja), **e
çelët**, **e errët** — dhe zgjedhja ruhet te `localStorage`. I shtypuri dallohet nga
`aria-pressed`, si te shiriti i muajve, prandaj ndërrimi i temës nuk e rivizaton kontrollin
dhe fokusi mbetet aty ku ishte.

Zgjedhja shkon te `data-tema` i `<html>`, dhe kjo bëhet nga [`public/tema.js`](../public/tema.js)
— skriptë e zakonshme, bllokuese te `<head>`-i, jashtë paketës së Vite-s. Po ta bënte
`main.js`, që është modul dhe pra i shtyrë, faqja do të vizatohej një çast me temën e
sistemit para se zgjedhja të vlente: për dikë që ka zgjedhur terrin, pikërisht ajo ndezje e
bardhë që tema e errët duhet të parandalojë. Kjo është arsyeja e vetme pse një copë sjellje
rri jashtë `src/`. Pa JavaScript humbet vetëm zgjedhja me dorë — tema e sistemit punon njësoj.

Ngjyra e shiritit të shfletuesit e ndjek zgjedhjen: te `<head>`-i rrinë dy
`<meta name="theme-color">` me `media`, dhe kur përdoruesi zgjedh vetë, `media`-ja e asaj që
duhet bëhet `all` e tjetra `not all`. Bashkë me të shkon `color-scheme`, që shiritat e
rrëshqitjes dhe kontrollet e shfletuesit të mos mbeten të temës së sistemit mbi një faqe të
temës tjetër.

Paleta e natës rri një herë të vetme te tokenat `--n-*`; dy rregulla e ndezin — një për
sistemin, një për zgjedhjen — sepse CSS-ja nuk e ndan dot një bllok mes një `@media`-je dhe
një përzgjedhësi. Përsëritet lista e emrave, kurrë vlerat, dhe
[`test/tema.test.mjs`](../test/tema.test.mjs) i mban të dyja listat të njëjta e të plota. Në
shtypje vlen `:root[data-tema]` bashkë me `:root`, që letra të dalë e bardhë edhe kur në
ekran është zgjedhur terri.

### Njoftimi për gabim

Orari transkriptohet me dorë nga një skanim, dhe rotacioni pas 31.08.2026 është i
llogaritur — prandaj një datë e shkëmbyer është e mundshme. Fundfaqja ka një kartelë me
lidhjen te [kontaktet e autorit](https://www.rilindkycyku.dev/contacts), që personi i
cili e vë re gabimin të ketë ku ta thotë pa hapur GitHub. Adresa ndryshohet te `AUTORI`
në [`src/faqja.js`](../src/faqja.js).

## Provat

```bash
npm test          # node --test, pa varësi
```

Logjika e kohës është e ndarë te [`src/koha.js`](../src/koha.js), pa `import` të JSON-it,
pikërisht që `node --test` t'i ekzekutojë provat pa bundler. Ajo është pjesa që gabon pa
u dukur: një gabim në kalimin e mesnatës nuk rrëzon faqen — vetëm dërgon dikë te
barnatorja e gabuar në ora 02:00.

[`test/koha.test.mjs`](../test/koha.test.mjs) mbulon kufijtë (21:59 → 22:00 → 00:00 → 07:59
→ 08:00), natën që kalon fundvitin, ndërrimin e orës verore, dhe një kalim mbi të gjitha
1440 minutat e ditës që kontrollon se `kaluar + mbeten = gjatësia` gjatë natës — pikërisht
thyesa me të cilën vizatohet shiriti. Provat vendosin `TZ = Europe/Belgrade`, që të dalin
njësoj në çdo makinë.

[`test/orari-2026.test.mjs`](../test/orari-2026.test.mjs) provon të dhënat e gjeneruara: data
të njëpasnjëshme pa hapësira, dita e javës që i përgjigjet datës, `mbaronMe` një ditë pas,
rotacioni 10-ditor sipas radhës së shpallur, flamuri `zyrtare` vetëm brenda dokumentit,
sezoni që ndërron te data e duhur, dhe lidhjet e hartave që kalojnë validimin. Kështu një
`npm run gjenero` i gabuar bie te provat, jo te faqja.

[`test/seo.test.mjs`](../test/seo.test.mjs) provon atë që e sheh vetëm makina: se HTML-ja e
gatshme i mban të gjitha netët e orarit dhe asnjë shenjë „tani" të ngrirë, se grafi JSON-LD
del JSON i vlefshëm me `@id`-të e veta dhe pa fusha të zbrazëta, dhe se çdo përgjigje e
`FAQPage`-it shfaqet fjalë për fjalë edhe në faqe — Google-i e pranon vetëm ashtu.

[`test/stili.test.mjs`](../test/stili.test.mjs) i mban dy vendime që një rresht i vetëm
CSS-i i prish pa u vënë re: se fonti vjen nga vetë paketa e jo nga një domen tjetër (me
`font-display: swap`, pa peshë mbi 700), dhe se asnjë kalim nuk është kthyer — as te CSS-i,
as te SVG-të, as te ikonat e gjeneruara.

[`test/tema.test.mjs`](../test/tema.test.mjs) provon atë që prishet pa u dukur te tema: se të
dyja rrugët e natës — ajo e sistemit dhe ajo e zgjedhjes — kalojnë saktësisht të njëjtat
tokena, se `color-scheme` shkon bashkë me zgjedhjen, se shtypja mbetet e bardhë edhe me
terrin e zgjedhur, dhe se `public/tema.js` mbetet skriptë bllokuese te `<head>`-i, pa `defer`
e pa u bërë modul — përndryshe tema do të vinte pas vizatimit të parë.

## Kërkimi

Dikush që shkruan „barnatorja kujdestare Kaçanik" duhet ta gjejë këtë faqe, dhe përgjigjja
duhet t'i dalë edhe atij që nuk e hap fare — te fragmenti i rezultatit ose te përgjigjja e
një asistenti. Prandaj orari nuk rri vetëm brenda JavaScript-it.

### Faqja e gatshme brenda HTML-së

Pas `vite build`, [`scripts/parafaqja.mjs`](../scripts/parafaqja.mjs) e mbush `dist/index.html`:
brenda `<div id="app">` shkruhet orari i plotë i të gjithë muajve, lista e barnatoreve me
adresa, pyetjet e shpeshta dhe fundfaqja me bazën ligjore. Google-i e ekzekuton
JavaScript-in, por Bing-u, Facebook-u, WhatsApp-i dhe robotët e asistentëve zakonisht jo —
për ta faqja e mëparshme ishte një `<div>` i zbrazët. HTML-ja rritet në rreth 10 kB të
ngjeshura dhe shërben edhe si faqe e plotë për këdo me JavaScript të fikur.

Markup-i nuk shkruhet dy herë: [`src/faqja.js`](../src/faqja.js) i mban të njëjtat funksione
që përdor edhe shfletuesi, dhe rregulli aty është që asgjë të mos prekë `document`,
`navigator` as `new Date()`. Kartela „tani" dhe „netët në vijim" nuk parandërtohen fare —
HTML-ja shkruhet një herë dhe lexohet muaj më vonë, prandaj çdo „tani" i ngrirë aty do të
ishte gabim i sigurt. Sapo skripta ngarkohet, `main.js` e zëvendëson përmbajtjen me pamjen
e drejtpërdrejtë.

### Të dhënat e strukturuara

[`src/skema.js`](../src/skema.js) ndërton një graf schema.org (JSON-LD) që shkruhet te
`<head>`-i gjatë ndërtimit: `WebSite`, `WebPage`+`FAQPage`, `GovernmentService` për vetë
kujdestarinë 22:00–08:00, `GovernmentOrganization` për komunën me drejtorinë brenda,
`City`, `CreativeWork` për dokumentin e skanuar nga i cili është transkriptuar orari, dhe
një `Pharmacy` për secilën barnatore me adresën, telefonin, lidhjen e Google Maps-it dhe
orarin e rregullt.

Asgjë nuk shpiket: fusha që nuk dihet — telefoni që mungon, koordinatat e sakta të një
barnatoreje — thjesht nuk shkruhet. Netët e kujdestarisë nuk shkojnë te
`openingHoursSpecification`, sepse qindra data do ta frynin faqen pa i dhënë asgjë
lexuesit; ato i mban tabela.

JSON-LD-ja është bllok të dhënash, jo skriptë që ekzekutohet, prandaj `script-src 'self'`
e CSP-së nuk e prek — e provuar në Chromium me pikërisht headers-at e
[`vercel.json`](../vercel.json).

### Titulli, përshkrimi dhe adresat

Titulli dhe përshkrimi ndërtohen nga vetë të dhënat (`TITULLI`, `PERSHKRIMI` te
[`src/faqja.js`](../src/faqja.js)) dhe i shkruhen `<head>`-it gjatë ndërtimit, që kur komuna
publikon orarin e ri të mos mbetet asnjë periudhë e vjetër te rezultati i kërkimit. Teksti
te [`index.html`](../index.html) është vetëm rezervë për `npm run dev`.

Titulli i skedës vazhdon të ndryshojë çdo natë — „Rigoni-2 — barnatorja kujdestare tani në
Kaçanik" — sepse përgjigjja duhet të duket edhe kur skeda është një nga të shumtat; fjalët
që kërkohen mbeten aty në të dyja format.

Domeni i faqes — `https://kujdestaria.rilindkycyku.dev` — rri si `DOMENI` te
[`scripts/parafaqja.mjs`](../scripts/parafaqja.mjs), dhe prej tij dalin `canonical`, `og:url`,
`og:image` dhe `sitemap.xml`. Nuk merret nga `VERCEL_PROJECT_PRODUCTION_URL`, sepse ajo
kthen adresën `*.vercel.app` po qe se domeni me emër nuk është i pari te projekti, dhe një
`canonical` i tillë do t'ia kalonte peshën e kërkimit adresës së gabuar. Për një kopje diku
tjetër mjafton `KUJDESTARIA_BAZA`, që i mbizotëron të dyja.

### robots.txt dhe sitemap.xml

Të dyja gjenerohen gjatë ndërtimit, jo me dorë te `public/`, sepse `sitemap.xml` kërkon
adresa absolute dhe `robots.txt` e tregon vendin e tij. Pa domen të njohur shkruhet vetëm
`robots.txt`, pa rreshtin `Sitemap:`. Asnjëra nuk hyn në paracache të service worker-it —
i lexojnë vetëm robotët.

### Pyetjet e shpeshta

Seksioni i pyetjeve nuk është zbukurim SEO-je: janë pyetjet që njerëzit shkruajnë te
kërkimi („a ka barnatore hapur natën", „deri në sa orë punojnë barnatoret") me përgjigje të
ndërtuara nga të dhënat. I njëjti tekst shkon te `FAQPage` i grafit — Google-i i pranon
përgjigjet vetëm nëse duken edhe në faqe, prandaj burimi është një i vetëm
([`pyetjet()`](../src/faqja.js)) dhe një provë e mban të lidhur.

## PWA — instalim dhe punë pa internet

Faqja instalohet në ekranin kryesor dhe punon plotësisht pa internet. Kjo e fundit është
arsyeja kryesore: orari është i futur brenda paketës JS, prandaj pasi faqja hapet një
herë, dikush që kërkon barnatoren kujdestare natën me sinjal të dobët e merr përgjigjen
gjithsesi.

| Skedari | Roli |
| --- | --- |
| [`public/manifest.webmanifest`](../public/manifest.webmanifest) | emri, ikonat, `display: standalone` |
| [`public/sw.js`](../public/sw.js) | service worker-i |
| [`scripts/pergatit-sw.mjs`](../scripts/pergatit-sw.mjs) | shkruan listën e paracache-it pas ndërtimit |
| [`scripts/gjenero-ikonat.mjs`](../scripts/gjenero-ikonat.mjs) | ikonat PNG, pa varësi |

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

### Butoni „Instalo si aplikacion"

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

[`vercel.json`](../vercel.json) e mbulon konfigurimin; Vercel-i e njeh vetë projektin si
Vite, prandaj mjafton ta lidhësh depon dhe të bësh deploy.

**Cache-i** është pjesa që ka rëndësi këtu. Skedarët te `/assets/` kanë emër me hash,
prandaj ruhen një vit si `immutable`. `index.html` shërbehet me `must-revalidate`, që
kur të dalë orari i ri të mos mbetet askush me faqen e vjetër në cache.

**Headers-at e sigurisë** vendosen për të gjitha rrugët: CSP (`default-src 'self'`, pa
`unsafe-inline`), `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` dhe
`Permissions-Policy`. Faqja nuk ka skripta as stile inline, prandaj CSP-ja e rreptë
kalon pa përjashtime — e provuar në Chromium me pikërisht këto headers.

### Imazhi i ndarjes

Lidhja ndahet shumë në WhatsApp e Viber, prandaj `public/ndarje.png` (1200×630) gjenerohet
nga [`scripts/gjenero-ikonat.mjs`](../scripts/gjenero-ikonat.mjs) me të njëjtin motiv si
ikona e instaluar — kartela në bisedë dhe ikona në ekranin kryesor njihen si një gjë e
vetme. Nuk ka tekst në imazh: shkrimi i PNG-së me dorë nuk ka font, dhe titullin me
përshkrimin i shkruan vetë aplikacioni nga `og:title` e `og:description`.

Imazhi **nuk hyn në paracache** — e shikojnë vetëm robotët, kurrë përdoruesi.

Te `index.html` rruga është relative, sepse domeni nuk dihet kur shkruhet kodi. Robotët e
WhatsApp-it dhe të Facebook-ut kërkojnë URL absolute, prandaj `parafaqja.mjs` e plotëson
pas ndërtimit nga `DOMENI` — bashkë me `canonical`, `og:url` dhe `sitemap.xml`. Për një
kopje në një domen tjetër:

```bash
KUJDESTARIA_BAZA=https://domeni-i-yt npm run build
```

Ndërtimi e shkruan në dalje se cilin domen përdori.

### Analytics

[Vercel Analytics](https://vercel.com/docs/analytics) thirret me `inject()` në fund të
[`src/main.js`](../src/main.js). Duhet aktivizuar edhe te paneli i projektit në Vercel
(**Analytics → Enable**), përndryshe grumbullimi nuk ndodh.

Skripta shërbehet nga vetë domeni (`/_vercel/insights/script.js`), prandaj hyn te
`script-src 'self'` dhe nuk kërkon lirim në CSP. Jashtë Vercel-it — në `npm run dev`,
`npm run preview` ose ndonjë host tjetër — kërkesa kthen 404 dhe thjesht injorohet;
faqja punon njësoj.

Për Speed Insights mjafton `npm i @vercel/speed-insights` dhe një `injectSpeedInsights()`
po aty; nuk është shtuar sepse nuk u kërkua.

## Të dhënat

Të gjitha të dhënat janë në [`src/data/orari-2026.json`](../src/data/orari-2026.json), i
gjeneruar nga [`scripts/gjenero-orarin.mjs`](../scripts/gjenero-orarin.mjs).

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
`kujdestariaTani()` në [`src/orari.js`](../src/orari.js) nuk mjafton të kthejë
`kujdestariaPer(dataSot())`.

### Harta, adresa dhe telefoni

Çdo barnatore mund të ketë lidhje Google Maps, adresë dhe telefon. Vendosen te
`BARNATORET` në [`scripts/gjenero-orarin.mjs`](../scripts/gjenero-orarin.mjs):

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

Lidhjet kalojnë nga [`src/harta.js`](../src/harta.js), që pranon vetëm `https:` dhe vetëm
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
