# Before the Buzzer

A turn-based basketball career simulator for iOS (Android later), built with Expo and
TypeScript. See [PLAN.md](PLAN.md) for the full plan and [docs/reports](docs/reports) for the
phase reports.

## Status

- **Phase 1 (engine):** done. A career runs headless from player creation to draft night.
- **Phase 2 (interface):** every screen in the plan is built, with the design system,
  illustrated portraits, God Mode and saves (SQLite on devices, IndexedDB on the web).
- **Phase 3 (2D clips):** 18 play templates with success and failure variants, drawn with Skia.
- **Phase 4 (content and balance):** 72 events, 46 key moments, 32 traits, 164 social posts.
- **Phase 5 (polish):** icon and splash, haptics, reduced motion, Dynamic Type stacking,
  performance overlay. The real-device check is still to do with you.

## Commands

| Command                                                 | What it does                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| `npm start`                                             | Expo dev server (Expo Go on your phone, or a simulator)      |
| `npm run web`                                           | The app in a browser                                         |
| `EXPO_PUBLIC_GOD_MODE=1 npm start`                      | A build with God Mode, the style guide and portrait lab      |
| `npm test`                                              | Engine, content, localisation and UI-logic tests (Vitest)    |
| `npm run check`                                         | Typecheck, lint, format check and tests                      |
| `npm run play`                                          | Play a career in the terminal                                |
| `npm run play -- --auto expert`                         | Watch a bot play a career (`naive`, `casual`, `expert`)      |
| `npm run sim -- --careers 60 --seasons 2 --seed my-run` | Balance report in `docs/balance/`                            |
| `npm run portraits`                                     | Portrait parts sheet, samples and lab in `docs/design/`      |
| `npm run clips:frames`                                  | Contact sheets of every clip template in `docs/clips/`       |
| `scripts/screens/all.sh docs/screens`                   | Plays a career on the web build and screenshots every screen |

God Mode opens by tapping the version number in Settings seven times, in a God Mode build only.

## Layout

- `app/`: routes (Expo Router); thin files that render a feature screen
- `src/engine/`: the game engine; pure TypeScript, deterministic, no React
- `src/content/`: typed game data and its validation
- `src/i18n/`: the localisation layer and English text
- `src/state/`: the session store and game controller; views and stats for screens
- `src/features/`: screens
- `src/ui/`: design tokens, theme, components, portraits and the clip renderer
- `src/platform/`: storage, haptics, Skia loading
- `scripts/`: simulation, terminal play, screenshots, portrait and clip sheets, brand marks
- `docs/`: design studies, balance reports, clip sheets, screenshots and phase reports
