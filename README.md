# Kids Mini Games (6 titles)

Android tablet mini-games for preschool children, built from one codebase into 6 separate APKs.

| ID | Game |
|---|---|
| ocean | 海のおそうじゲーム |
| sushi | お寿司パズル |
| findfish | おさかな探し |
| puzzle | おさかなパズル |
| diff | 間違い探し |
| order | 注文のお手伝いゲーム |

Target devices: Android 12 (1920×540, 1280×800), Android 9 (1920×1080).

## Technology

Phaser 4 + TypeScript, built with Vite, packaged as Android apps with Capacitor 8.
The build targets Chrome 69 so the game runs on older Android 9 WebViews.

## Requirements

- Node.js 22 or later
- JDK 21, Android SDK (platform 36, build-tools 35/36) for Android builds

## Development

```bash
npm install
npm run dev          # http://127.0.0.1:5173 (development test scene)
npm run typecheck
npm run build        # production web build into dist/
npm run cap:sync     # build + copy into the Android project
```

## Project structure

```
src/
  main.ts            entry point (selects the game from VITE_GAME)
  core/              shared framework (layout, flow, timer, exit, pause)
  games/<id>/        one folder per game (logic, stages, scenes)
  scenes/            shared and development scenes
android/             Capacitor Android project
docs/                specification and asset licences
assets-src/          source art, audio and fonts
```

Android build instructions: to be added.
