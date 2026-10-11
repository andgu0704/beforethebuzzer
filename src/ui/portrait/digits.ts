/**
 * Jersey numerals: a condensed, chamfered block face drawn on a 6×10 grid, close in spirit to
 * the Antonio display type. The first contour of a digit is its outline, any others are
 * counters, written anticlockwise so they cut out under the non-zero rule.
 */
import { hole, poly, type Pt } from './shapes';

const W = 6;
const H = 10;

const octagon: Pt[] = [
  [1.5, 0],
  [4.5, 0],
  [6, 1.5],
  [6, 8.5],
  [4.5, 10],
  [1.5, 10],
  [0, 8.5],
  [0, 1.5],
];
const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];

const two: Pt[] = [
  [0, 2.6],
  [0, 1.5],
  [1.5, 0],
  [4.5, 0],
  [6, 1.5],
  [6, 4.4],
  [4.5, 5.9],
  [1.8, 5.9],
  [1.8, 8.2],
  [6, 8.2],
  [6, 10],
  [0, 10],
  [0, 5.6],
  [1.5, 4.1],
  [4.2, 4.1],
  [4.2, 1.8],
  [1.8, 1.8],
  [1.8, 2.6],
];

const six: Pt[] = [
  [1.5, 0],
  [6, 0],
  [6, 1.8],
  [1.8, 1.8],
  [1.8, 4.1],
  [4.5, 4.1],
  [6, 5.6],
  [6, 8.5],
  [4.5, 10],
  [1.5, 10],
  [0, 8.5],
  [0, 1.5],
];

const rotate = (pts: readonly Pt[]): Pt[] => pts.map(([x, y]) => [W - x, H - y]);

/** Contours per digit, in grid units. */
const DIGITS: readonly (readonly Pt[])[][] = [
  [octagon, rect(1.8, 1.8, 4.2, 8.2)],
  [
    [
      [1.0, 1.5],
      [2.5, 0],
      [4.3, 0],
      [4.3, 10],
      [2.5, 10],
      [2.5, 2.8],
      [1.0, 2.8],
    ],
  ],
  [two],
  [
    [
      [0, 0],
      [4.5, 0],
      [6, 1.5],
      [6, 8.5],
      [4.5, 10],
      [0, 10],
      [0, 8.2],
      [4.2, 8.2],
      [4.2, 5.9],
      [1.2, 5.9],
      [1.2, 4.1],
      [4.2, 4.1],
      [4.2, 1.8],
      [0, 1.8],
    ],
  ],
  [
    [
      [0, 0],
      [1.8, 0],
      [1.8, 4.6],
      [4.2, 4.6],
      [4.2, 0],
      [6, 0],
      [6, 10],
      [4.2, 10],
      [4.2, 6.4],
      [1.5, 6.4],
      [0, 4.9],
    ],
  ],
  [
    [
      [0, 0],
      [6, 0],
      [6, 1.8],
      [1.8, 1.8],
      [1.8, 4.1],
      [4.5, 4.1],
      [6, 5.6],
      [6, 8.5],
      [4.5, 10],
      [0, 10],
      [0, 8.2],
      [4.2, 8.2],
      [4.2, 5.9],
      [0, 5.9],
    ],
  ],
  [six, rect(1.8, 5.9, 4.2, 8.2)],
  [
    [
      [0, 0],
      [6, 0],
      [6, 2.2],
      [3.4, 10],
      [1.5, 10],
      [4.1, 1.8],
      [0, 1.8],
    ],
  ],
  [octagon, rect(1.8, 1.8, 4.2, 4.1), rect(1.8, 5.9, 4.2, 8.2)],
  [rotate(six), rotate(rect(1.8, 5.9, 4.2, 8.2))],
];

/**
 * Path data for a jersey number centred on (cx, top), `height` tall. Numbers are 0–99;
 * anything else is clamped.
 */
export function numberPath(value: number, cx: number, top: number, height: number): string {
  const n = Math.min(99, Math.max(0, Math.round(value)));
  const text = String(n);
  const scale = height / H;
  const gap = 0.9;
  const total = text.length * W + (text.length - 1) * gap;
  let x0 = cx - (total * scale) / 2;
  let out = '';
  for (const ch of text) {
    const contours = DIGITS[Number(ch)] ?? [];
    const x = x0;
    contours.forEach((c, i) => {
      const placed = c.map(([px, py]): Pt => [x + px * scale, top + py * scale]);
      out += i === 0 ? poly(placed) : hole(placed);
    });
    x0 += (W + gap) * scale;
  }
  return out;
}
