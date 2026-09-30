# Source art

Final game art goes here, one PNG per sprite:

```
assets-src/images/<atlas>/<name>.png
```

The atlases and sprite names are listed in `src/core/assets/catalog.ts` (for example
`assets-src/images/fish/tuna.png`, `assets-src/images/sushi/topping-salmon.png`).
Any sprite without a file is drawn as a labelled placeholder, so art can be added one file at a time.

## Requirements

- PNG, sRGB, on a **transparent or plain light background** (white is best): a plain background is removed
  automatically (`tools/lib/remove-background.mjs`); light areas inside the object are kept.
- At least the catalog size (width × height in design units, where the screen is 1080 tall); larger is fine —
  the build trims empty borders and scales the image to fit the catalog box.
- **Fish and sea creatures face left.** The game flips them when they swim right.
- No text, logos or brand marks inside images; no mascot characters.
- Record every file in `docs/LICENSES.md` (tool or source, licence, date).

## Build

```bash
npm run assets
```

Packs everything into `public/assets/<atlas>.png` and `.json` (generated, not committed) and reports how many
sprites per atlas still use placeholders. `npm run dev` and `npm run build` run it automatically.

## Style samples

Put samples in `assets-src/style-samples/<style>/tuna.png`, `nigiri.png`, `can.png` (one folder per style,
e.g. `A`, `B`, `C`), then:

```bash
npm run style-sheet   # writes assets-src/style-samples/sheet.png
```
