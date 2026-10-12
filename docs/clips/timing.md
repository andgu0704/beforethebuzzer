# Clip timing

Measured by `npm run clips:frames` in Node v22.22.0 on this machine, over 67 plays
(every template and outcome) at evenly spaced times. The UI-thread budget at 60 fps is 16.7 ms
per frame.

| Work                                                                  | Per call |
| --------------------------------------------------------------------- | -------- |
| `buildPlay` (once per clip, JS thread)                                | 0.733 ms |
| `sample` (one frame of positions, clocks and score)                   | 4.55 µs  |
| `sample` + `describeFrame` (the full frame description)               | 9.81 µs  |
| Full frame painted into a Skia picture (headless CanvasKit, software) | 0.388 ms |

On the device the description runs inside a Reanimated worklet and is painted by native Skia; the
CanvasKit line is only an upper bound for the drawing work.
