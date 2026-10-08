# Source art

All game pictures live in `assets-src/images/`. `npm run assets` turns them into the files the games load
(`public/assets/`, generated, not committed). `npm run dev` and `npm run build` run it automatically.

```
assets-src/images/
  atlases/<atlas>/<sprite>.png    small pictures, packed into one texture atlas per folder
    fish/        sea creatures (おさかな探し, おさかなパズル …)
    sushi/       rice, toppings, plates
    trash/       litter for 海のおそうじゲーム
    props/       table items (teacup, soy dish …)
    scenery/     sea-floor decorations
    ui/          shared buttons (btn-*) and small icons (icon-*)
    characters/  guide character (client-provided) and the starfish
  games/<game-id>/                pictures used by one game only
    start-background.png          start-screen picture
    start-title.png               start-screen title logo (transparent)
    header-title.png              flatter title logo for the game screen's header (transparent)
    backdrop.png                  full-screen picture behind the game screen
    field.png                     picture inside the play area's frame (sea, sushi counter…)
  app-icons/<game-id>.png         launcher icon of each app: a square picture on a flat background
                                  colour (tools/build-app-icon.mjs turns it into the Android icons)
  puzzles/<picture>.png           pictures cut into pieces by the puzzle game
```

Game ids: `ocean` ① · `sushi` ② · `findfish` ③ · `puzzle` ④ · `diff` ⑤ · `order` ⑥.

## Naming

- Lowercase letters, digits and hyphens only (`sea-bream.png`, not `Sea Bream.png`); PNG.
- The folder says what kind of picture it is, so the file name does not repeat it
  (`app-icons/ocean.png`, not `icons/icon-ocean.png`).
- In `ui/`, start buttons with `btn-` and icons with `icon-`; variants of one thing share a prefix
  (`guide.png`, `guide-happy.png`).

## Adding a picture

1. Save it under the right folder and name.
2. Register it in `src/core/assets/catalog.ts`:
   - atlas sprite → add it to that atlas in `ATLASES` (with its Japanese name and display size);
   - game picture → list the file under the game in `GAME_ART` (e.g. `ocean: ['start-background', 'start-title']`).
3. Record it in `docs/LICENSES.md` (tool or source, prompt, licence, date).
4. Run `npm run assets` and check the report: atlases show `art n/m`, other pictures their size, and anything
   missing or unknown is listed.

An atlas sprite without a file is drawn as a labelled placeholder; a game without its own start screen or
backdrop shows the plain light-blue look. So art can be added one file at a time.

### Screen-filling pictures (start-background, backdrop, field)

- Draw them **32:9** (e.g. 3840×1080; at least 1080 px tall), the main device's shape.
- Keep everything important (title space, characters, focal point) inside the **centre 16:9** area: the 16:10
  and 16:9 devices show only the centre and cut the sides evenly.
- A narrower picture still works: it is shown whole in the centre with blurred sides, and `npm run assets`
  marks it `← narrow`. Widen it by extending its left and right sides (keep the centre unchanged).

## Requirements

- PNG, sRGB. Atlas sprites on a **transparent or plain light background** (white is best): a plain background
  is removed automatically (`tools/lib/remove-background.mjs`); light areas inside the object are kept.
- At least the catalog size (design units, screen 1080 tall); larger is fine — sprites are trimmed and scaled.
- Backgrounds and game pictures: landscape, about 1536×1024 or larger. On the 32:9 main screen they are repeated
  side by side with every other copy mirrored, so soft left/right edges look best.
- **Fish and sea creatures face left.** The game flips them when they swim right.
- No text, logos or brand marks inside images, except title logos. The client's character is used only in games ①–④.

## Style samples

`assets-src/style-samples/` holds the early style comparison (`npm run style-sheet` writes `sheet.png`).
