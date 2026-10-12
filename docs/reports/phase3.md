# Phase 3 report: 2D clips

## What was built (`src/ui/clips`)

- **Plays** (`plays.ts`, `templates.ts`, `builder.ts`, `finish.ts`, `track.ts`):
  - **18 templates:** fast break, pick-and-roll pull-up and roll, isolation pull-up, step-back
    three, catch-and-shoot three, drive layup, drive and kick, post-up, floater, alley-oop,
    put-back, block, steal and run-out, charge, trainer check, last-second heave and free throws.
  - **Outcomes:** each template has a version for every outcome the engine produces (make,
    miss, block, steal, turnover, assist, stop, scored, pain).
  - **Variation:** a small seeded change taken from the spec mirrors the play and moves the
    starting spots.
  - **Paths:** actors and the ball move along Catmull-Rom splines on a court measured in feet.
- **`sample(play, t)`** is a pure, worklet-safe function. It returns the positions, the ball's
  height, the contest ring, the ball trail, the game and shot clocks and a phase label.
- **`ClipPlayer`**: one Skia canvas, with a single Reanimated `progress` value driving
  everything on the UI thread.
  - The overlay is a broadcast-style scoreboard: team abbreviations in their colours, score,
    period, game clock and a shot clock that runs during the play.
  - Tapping skips to the result, and a replay button appears at the end.
  - `onBuzzer` fires when the game clock reaches 0:00. The app sends a heavy haptic for a close
    game and a light one otherwise.
  - A signature move replays its final beat at 0.4× with a REPLAY tag.
  - With reduced motion it shows the final frame, the result line and a play button.
- **Where clips appear:** in the decision sheet after a key-moment choice, from "Replay the
  moment" in the feed, and in the game report. The setting "Play clips automatically" switches
  autoplay off.

## Checks

- **Tests** (`plays.test.ts`) cover every template, all nine outcomes and two seeds:
  - every play builds, lasts 5–10 s and is deterministic;
  - actors and the ball stay in bounds, and players stay under 28 ft/s;
  - makes drop through the hoop and misses do not;
  - points go to the right side;
  - the clocks and buzzer and the signature timeline behave.
- **Contact sheets:** `npm run clips:frames` writes frames at t = 0, .25, .5, .75 and 1 for each
  template and variant to `docs/clips/`. A dark-theme sheet is included.
- **Timing in Node** (`docs/clips/timing.md`):
  - `sample` takes 4.6 µs per frame, and `sample` plus the full frame description 9.8 µs.
  - A headless CanvasKit paint takes 0.39 ms.
  - All of these are far inside the 16.7 ms budget for a frame at 60 fps.

## Known gaps

- **Frame timing on a device.** The plan asks for timing on the iOS Simulator and a real
  phone; that needs a Mac or your phone.
- **Inferred roles.** `ClipSpec` does not say whether the user shot or passed, so the clip
  infers it from the outcome and template.
- **Free throws.** "Make" shows 2 of 2, and any other outcome shows 1 of 2.
