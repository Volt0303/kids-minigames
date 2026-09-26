# Mini-Games Specification (draft)

Status: draft for client confirmation. Items marked **[TBC]** are waiting for the client's decision.

## 1. Overview

Six mini-games for preschool children (about 3–5 years old) to play on restaurant self-order tablets while waiting
for or eating their meal. Each game is a separate Android application.

| ID | Game | Package name [TBC] |
|---|---|---|
| ocean | ① 海のおそうじゲーム | `jp.impactmirai.kidsgame.ocean` |
| sushi | ② お寿司パズル | `jp.impactmirai.kidsgame.sushi` |
| findfish | ③ おさかな探し | `jp.impactmirai.kidsgame.findfish` |
| puzzle | ④ おさかなパズル | `jp.impactmirai.kidsgame.puzzle` |
| diff | ⑤ 間違い探し | `jp.impactmirai.kidsgame.diff` |
| order | ⑥ 注文のお手伝いゲーム | `jp.impactmirai.kidsgame.order` |

Each game: **3 stages, about 60 seconds per stage.**

## 2. Target devices

| Device | OS | Resolution | Aspect ratio |
|---|---|---|---|
| Main | Android 12 | 1920 × 540 | 32:9 |
| Sub 1 | Android 12 | 1280 × 800 | 16:10 |
| Sub 2 | Android 9 | 1920 × 1080 | 16:9 |

- Landscape only, full-screen (system bars hidden), screen kept on while playing.
- No network access, no analytics, no advertising. All assets are bundled in the APK.
- Screen density per device: **[TBC]**. Chrome/WebView version on the Android 9 device: **[TBC]**.

## 3. Integration with the order app

Requirements from the client's engineer (2026-09-24):

1. **Start choice:** when the game starts, the player can choose to play or not play.
2. **Self-exit:** when the game ends, the app closes itself and the calling app is shown again.
3. **Pause/resume:** when another app comes to the front, the game pauses; when it returns, the game resumes.

Implementation (landscape only, system bars hidden, screen kept on):

| Item | Behaviour |
|---|---|
| Launch | Standard Android launch intent for the package (no extra parameters). |
| Start screen | Two large buttons: 「あそぶ」 (play) and 「やめる」 (stop). 「やめる」 exits immediately. No touch for about 30 s → exit. **[TBC: timeout]** |
| Exit | The app finishes and removes its task (`finishAndRemoveTask`), so the calling app is shown and the game does not stay in the recent-apps list. |
| Exit triggers | All stages finished (after the clear screen); 「やめる」 on the start screen; close button; hardware back button; no touch for about 90 s during play **[TBC: timeout]**. |
| Pause | On switching to another app: game loop, stage timer, hints, spawning and sound stop. |
| Resume | On return: the game continues from where it stopped. |
| Relaunch while paused | The game is hidden from the recent-apps list, so being launched again by the order app is how it returns: a paused game **continues where it stopped**. Launching it while it is already in front changes nothing. |
| Long pause | Paused more than about 5 minutes → back to the start screen when it returns. **[TBC]** |
| Process killed by Android | The game starts again from the start screen. |
| Kiosk mode | If the order app uses Android lock-task mode, the six package names must be added to its allowed list (client side). |

## 4. Common game rules

- **Flow:** Start screen → Stage 1 → stage clear → Stage 2 → stage clear → Stage 3 → all clear → exit.
- **Timer:** 60 s per stage. A stage ends early when its goal is reached. When time runs out the stage still ends
  positively (「よくできたね！」); there is no failure state. **[TBC]**
- **Prompts:** picture first, short hiragana text, voice **[TBC: voice yes/no]**.
- **Feedback:** correct = sparkle + sound; wrong = gentle wobble + soft sound; no penalty and no red ×.
- **Hints:** after about 8 s without progress, a pulsing ring highlights something correct for 3 s; it repeats every 8 s while the child is still stuck and disappears on a correct tap.
- **Touch:** targets at least about 13% of screen height; tap areas larger than the image; multi-touch ignored.
  Where dragging is used, tapping is also accepted where possible.
- **Sound:** sound effects on; background music default **[TBC]**; audio stops while paused.
- **Layouts:** two layout modes — *wide* (aspect ratio ≥ 2.4, the 1920×540 device) and *standard* (16:10 and 16:9).
  Every screen is designed in both modes.

## 5. Games

### ① 海のおそうじゲーム (ocean)
Tap trash (cans, bottles, bags) floating and sinking in the sea while fish swim by. Collected trash goes to a bag counter.
Tapping a fish makes it wiggle and swim away (no penalty). When trash and a fish overlap, the tap goes to the trash.

| Stage | Goal | Difficulty |
|---|---|---|
| 1 | Collect 8 | Slow, few fish |
| 2 | Collect 10 | More fish |
| 3 | Collect 12 | Faster; trash partly behind fish |

### ② お寿司パズル (sushi)
An order card shows a sushi. Place the matching topping on the rice (tap or drag). About 5 orders per stage.
A wrong topping slides back.

| Stage | Toppings to choose from |
|---|---|
| 1 | 4 |
| 2 | 6 |
| 3 | 8, including similar-looking toppings |

### ③ おさかな探し (findfish)
A prompt card shows a fish (「〇〇をみつけてね」). Fish swim slowly across the screen; tap the matching fish.

| Stage | Targets | Fish on screen | Notes |
|---|---|---|---|
| 1 | 3 | 8 | Very different shapes |
| 2 | 4 | 12 | |
| 3 | 5 | 12–15 | Look-alike fish, faster movement |

### ④ おさかなパズル (puzzle)
Drag pieces from a tray onto a board with a faint outline. A piece snaps into place when dropped near its slot;
otherwise it returns to the tray. A hint button briefly shows the complete picture.
Piece shape: rounded rectangles or jigsaw tabs **[TBC]**.

| Stage | Pieces |
|---|---|
| 1 | 4 (2 × 2) |
| 2 | 6 (3 × 2) |
| 3 | 6, different artwork |

Layout: wide = board left, tray right; standard = board top, tray bottom.

### ⑤ 間違い探し (diff)
Two pictures side by side. Tapping a difference on either picture marks it on both.
Scenes are assembled from sprites and the differences are defined as data (hidden, recoloured, moved, swapped).

| Stage | Scene | Differences |
|---|---|---|
| 1 | Sea | 3 |
| 2 | Sea | 4 |
| 3 | Sushi | 5 |

### ⑥ 注文のお手伝いゲーム (order)
An order such as 「マグロを2つ・エビを1つ」 is shown with pictures and count pips. Tap the matching sushi on a
plate or conveyor; they move to the tray. Wrong sushi wobble. Orders repeat until the stage ends.

| Stage | Order |
|---|---|
| 1 | One kind |
| 2 | Two kinds |
| 3 | Three kinds, moving conveyor |

## 6. Assets

- Commercially licensed or AI-generated assets only; no original characters; no brand names or logos; no text in images.
- One consistent illustration style (flat, thick outline, bright). Images are transparent PNGs designed for a
  1080 px-high screen.
- Shared sprite library: about 14 fish/sea creatures, rice + 8 toppings + battleship sushi, 6 trash items, scenery,
  UI elements, 6 app icons (512 × 512 plus adaptive icon layers).
- Backgrounds built in layers (gradient + tileable strip + decorations) so they fit every aspect ratio.
- Audio: about 12 sound effects, 1–2 BGM loops, voice lines **[TBC]**. Font: a rounded Japanese font under the SIL OFL.
- Every asset, font and library is recorded in `docs/LICENSES.md`.

## 7. Technology

- Phaser 4 + TypeScript, built with Vite, packaged as Android apps with Capacitor.
- One codebase produces six APKs (one per game, each with its own package name, app name and icon).
- Verified on Android emulators matching the three target devices (Android 9 / 12, the three resolutions).
