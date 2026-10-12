# Phase 5 report: polish

## What was built

**Motion**
- Feed entries fade up as they arrive.
- Meters and decision outcomes count to their new values over 600 ms.
- Buttons press with a slight scale.
- Draft night slows down as your pick nears, then springs the reveal in.
- Clips run on the UI thread.
- Reduced motion turns counters into jumps, skips the feed and draft-night animations, and
  shows clips as a still frame with the result.

**Haptics** (§10.4), all switched off by the setting:

| Haptic | When |
| --- | --- |
| Selection | Tabs, segmented controls, steppers, chips |
| Light impact | Primary buttons and choices |
| Success | A key moment that works, a milestone, draft news, being drafted |
| Warning | A failed moment, an injury, becoming ineligible, going undrafted |
| Heavy impact | The buzzer in a close game |

**Accessibility**
- Every text style caps Dynamic Type at the plan's multiplier.
- At accessibility sizes the header meters wrap, and stepper and list rows put their label on
  its own line.
- Every control has a VoiceOver label. Stat lines read as sentences ("27 points, 6 rebounds…"),
  and steppers are adjustable with increment and decrement actions.
- Wins and losses use W and L as well as colour.

**Icon and splash:** a ball with the clock running out, on the buzzer orange
(`docs/design/icon-preview.png`). `scripts/brand/marks.mjs` renders the icon, adaptive icon,
splash and favicon from one SVG. **Waiting for your approval.**

**Development build**
- `expo-dev-client` is installed.
- `eas.json` has `development` and `simulator` profiles, both with God Mode, and a
  `production` profile without it.

**Performance**
- **Overlay:** God Mode can switch on an overlay showing JS frames per second and the last
  engine and save timings.
- **Sliced weeks:** the engine week now runs in slices (`advanceSlice`): the app paints after
  the week opens and after every two game slots. A test checks that sliced weeks end in the same
  save as whole weeks.
- **Saves:** the save is written off the interaction path, in a queue.

**Web bundle**
- Only the five font files the app uses are bundled.
- Portraits are SVG on the web, so a full roster does not run the browser out of WebGL contexts.

## Not done here: needs a device and you

- **60 fps on a real phone** in clips and feed scrolling. Install a development build
  (`eas build --profile development --platform ios`), turn on the overlay from God Mode, and
  scroll the feed and play a few key moments.
- **VoiceOver walkthrough and the largest Dynamic Type sizes** on the phone. The web build cannot
  show iOS text scaling.
- **Haptics and the share sheet**: these only exist on a device.
- **Engine timing on Hermes.** Phase 1 measured a 150 ms median week with heavy weeks up to
  ~1.1 s. With slicing those weeks no longer freeze the screen, but the total time is the same.
