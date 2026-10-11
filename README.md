# Before the Buzzer

A turn-based basketball career simulator for iOS (Android later), built with Expo and
TypeScript. See [PLAN.md](PLAN.md) for the full plan.

## Status

Phase 1 (engine) is complete: the game runs headless from player creation to draft night.
The app interface arrives in Phase 2.

## Commands

| Command                                                 | What it does                                            |
| ------------------------------------------------------- | ------------------------------------------------------- |
| `npm test`                                              | Engine, content and localisation tests (Vitest)         |
| `npm run play`                                          | Play a career in the terminal                           |
| `npm run play -- --auto expert`                         | Watch a bot play a career (`naive`, `casual`, `expert`) |
| `npm run sim -- --careers 60 --seasons 2 --seed my-run` | Balance report in `docs/balance/`                       |
| `npm run check`                                         | Typecheck, lint, format check and tests                 |

## Layout

- `src/engine/`: the game engine; pure TypeScript, deterministic, no React
- `src/content/`: typed game data and its validation
- `src/i18n/`: the localisation layer and English text
- `scripts/`: the simulation and terminal play scripts
- `docs/`: design studies and balance reports
