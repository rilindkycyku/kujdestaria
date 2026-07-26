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

Orari i punës është **08:00–22:00** gjatë tërë vitit: në sezonin veror sipas Rregullores
Komunale `01Nr.05-16-2609/15`, kurse në sezonin dimëror sipas Vendimit të Kryetarit
`01Nr.104/02-30047/22`, i cili e zgjat orarin dimëror nga 08:00–20:00 në 08:00–22:00.

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
  "rotacioni":   ["Flora", "Liampharm", "..."],
  "kujdestaria": [
    {
      "data": "2026-07-01",
      "dita": "E mërkurë",
      "barnatorja": "Flora",
      "pozitaNeCikel": 1,
      "sezoni": "veror",
      "orari": { "prej": "08:00", "deri": "22:00" },
      "zyrtare": true
    }
  ]
}
```

[pdf]: https://kacanik.rks-gov.net/wp-content/uploads/2026/06/Orari-Korrik-Gusht-2026.pdf
[shpalljet]: https://kacanik.rks-gov.net/shpalljet/
