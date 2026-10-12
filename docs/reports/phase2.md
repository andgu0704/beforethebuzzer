# Phase 2 report: interface

Built overnight on 11–12 October 2026, on top of the Phase 1 engine. Everything below runs in
the web build; the iOS Simulator and a real phone are the next checks (see the end).

## What was built

**Design system** (`src/ui/theme`, `src/ui/components`)

- Every token from §10: the colour palette in light and dark, the Antonio and Schibsted Grotesk
  type scale with Dynamic Type caps, spacing, radii and motion.
- Team accents in OKLCH. A test runs all 190 teams in both themes and checks that `onAccent`,
  `accentText` on the canvas and `accentText` on surfaces all reach 4.5:1.
- The components of §10.7: Text, Button, IconButton, Meter, AnimatedNumber, Scorebug,
  BoxScoreTable, StatLine, FeedItem, ChoiceButton (with "Because you…" badges), SegmentedControl,
  Stepper, PlanBar, Tag, Avatar/Portrait, TeamMark, Flag, ListRow, SectionHeader, Banner,
  EmptyState, ErrorState, Skeleton, Sparkline, Bracket, TabBar and ActionDock.
- The style guide renders every token and component in both themes. It is a God Mode screen
  and is left out of release builds.

**Portraits** (`src/ui/portrait`): a parts system with one art direction (§10.6), covering
every part count the engine generates and five expressions plus a draft-night one, with rules
that exclude bad part pairs. The native app draws them with Skia; the web draws the same
geometry as SVG, because browsers run out of WebGL contexts on a full roster. The parts sheet,
24 samples and the 100-face lab are in `docs/design/portrait-*.png` and are **waiting for your
approval**.

**Team marks and flags:** college monograms, 30 pro emblems in five badge shapes, and MIT flags
(`country-flag-icons`) with three-letter codes.

**Screens** (all of §11)

- Welcome and saves: portrait, team, week and badges; restore from backup; long-press to
  delete.
- Creation in six steps, with a live player card, inline validation and Randomise.
- Home: header and meters (grades appear as a meter when at risk), the feed grouped by week,
  and the action dock with simulate ahead and first-week tips.
- Train: weekly planner, plan bar, energy forecast, skills with trends, and traits with their
  unlock progress.
- Team: roster with letter grades, coach, schedule, standings, poll and tournament links.
- Career: draft stock with a rank sparkline and scout grades, agent, deals, contract, national
  team and combine.
- Social: feed with replies, press, and the side-by-side rival comparison.
- Profile: player card, seasons table, awards, the cause → effect timeline, and Settings from
  the header.
- Sheets: the decision sheet (events, key moments, offers, call-ups, the draft decision,
  withdrawal, workouts, agent and draft night) and the clip replay sheet.
- Pushed screens: game report, bracket, combine, draft night replay and the ending card with
  share.
- Settings and the name editor.
- God Mode: passcode prompt and full panel, plus the style guide and portrait lab.

**State and storage** (`src/state`, `src/platform`)

- A Zustand store holds the open career, and a controller runs every engine call: next week,
  simulate ahead one week per frame, decisions and God Mode edits.
- It saves after every decision boundary, off the interaction path. Saves go to SQLite in WAL
  mode on devices and to IndexedDB on the web, and both keep the previous save as a backup.

**God Mode** (§14)

- Seven taps on the version number open it.
- The passcode is checked against a PBKDF2-SHA256 hash (20,000 iterations, random salt) in
  constant time, with a five-try, ten-minute lockout that a clock turned back cannot lift.
- Unlocking is per career, and any action marks the career.
- Metro resolves `@/features/godmode` to a stub unless `EXPO_PUBLIC_GOD_MODE=1`. CI builds the
  release web bundle and fails if God Mode's sentinel string is in it; I checked that the God
  Mode build does contain it.

## Tests and checks

- `npm run check` (typecheck, lint, Prettier, Vitest) passes. The 78 tests now include accent
  contrast, the God Mode lock, the portrait geometry, the clip plays, content volume and a test
  that every interface text key the screens use exists.
- `scripts/screens/flow.mjs` plays a whole career in the web build: it creates a player,
  simulates ahead, answers every decision, goes through draft night and the ending, visits
  every tab and screen, and takes screenshots. `scripts/screens/all.sh` runs it in light and
  dark at 375 × 667 (iPhone SE) and 440 × 956 (iPhone 17 Pro Max). The contact sheets are in
  `docs/screens/`.

## Bugs the screenshot runs found and fixed

- The ending headline showed the rival's draft news instead of yours.
- Years were printed as "2,027".
- Role and level names were translated twice ("roles.bench player").
- Minutes per game in the seasons table were 60 times too small.
- A four-way segmented control was truncated at 375 pt.
- The decision sheet could be pushed twice, which left a duplicate sheet open.
- Web portraits exhausted WebGL contexts.

## A change from the plan

**React Compiler is off.** The engine mutates one `GameState` in place for speed, and the store
signals changes with a revision number. The compiler caches each component's output on the
identity of the objects it reads. The state object never changes identity, so the cache would
keep showing stale values; screens only stayed fresh by accident, through the translator hook.
I checked this by compiling the Home header and finding its meters cached on `state`.
Re-rendering is cheap here, so the compiler is switched off in `app.json` rather than working
around it file by file.

## Known gaps

- **No iOS Simulator here.** `.github/workflows/ios-screens.yml` (run it from the Actions tab)
  builds a release app for the simulator and runs the Maestro flow in `.maestro/` on iPhone SE
  and iPhone 16 Pro Max, in light and dark.
- **Native-only features are untested.** Form-sheet detents, haptics and sharing the career card
  only exist on a device. On the web the share button explains that sharing is unavailable.
- **Simulating a week blocks the screen.** The engine week still runs in one call behind the
  "Simulating" state; slicing it between frames is the next performance step (see the Phase 5
  report).
