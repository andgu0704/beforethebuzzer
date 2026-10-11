/**
 * Colour maths for team accents: sRGB ↔ OKLCH and WCAG contrast. Team colours are moved in
 * OKLCH lightness only, so a team keeps its hue and character while meeting contrast.
 */

export type Rgb = readonly [number, number, number];

export function parseHex(hex: string): Rgb {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  const n = Number.parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function toHex([r, g, b]: Rgb): string {
  const c = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const fromLinear = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);

export interface Oklch {
  readonly l: number;
  readonly c: number;
  readonly h: number;
}

export function rgbToOklch(rgb: Rgb): Oklch {
  const [r, g, b] = rgb.map(toLinear) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(A, B);
  const h = (Math.atan2(B, A) * 180) / Math.PI;
  return { l: L, c, h: h < 0 ? h + 360 : h };
}

export function oklchToRgb({ l: L, c, h }: Oklch): Rgb {
  const A = c * Math.cos((h * Math.PI) / 180);
  const B = c * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [fromLinear(r), fromLinear(g), fromLinear(b)].map((v) => Math.min(1, Math.max(0, v))) as [
    number,
    number,
    number,
  ];
}

export function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map(toLinear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const la = luminance(parseHex(a));
  const lb = luminance(parseHex(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Moves a colour's OKLCH lightness towards `direction` until it reaches `ratio` against `against`. */
export function withContrast(
  hex: string,
  against: string,
  ratio: number,
  direction: 'darker' | 'lighter',
): string {
  const base = rgbToOklch(parseHex(hex));
  if (contrast(hex, against) >= ratio) return toHex(parseHex(hex));
  for (let i = 1; i <= 100; i++) {
    const l = direction === 'darker' ? base.l - i * 0.01 : base.l + i * 0.01;
    // Chroma falls away at the extremes so the colour stays inside sRGB.
    const c = base.c * Math.min(1, Math.max(0.2, 1 - Math.abs(l - 0.6) * 0.8));
    const candidate = toHex(oklchToRgb({ l: Math.min(1, Math.max(0, l)), c, h: base.h }));
    if (contrast(candidate, against) >= ratio) return candidate;
  }
  return direction === 'darker' ? '#000000' : '#FFFFFF';
}

/** Mixes `hex` into `base` at `amount` (0–1), in sRGB. */
export function mix(hex: string, base: string, amount: number): string {
  const a = parseHex(hex);
  const b = parseHex(base);
  return toHex([
    b[0] + (a[0] - b[0]) * amount,
    b[1] + (a[1] - b[1]) * amount,
    b[2] + (a[2] - b[2]) * amount,
  ]);
}
