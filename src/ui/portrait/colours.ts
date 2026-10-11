/**
 * Portrait colours. Each skin tone has exactly one base, one shadow and one highlight tone
 * (PLAN.md §10.6), plus the lip tones derived from it. Shadows move towards red and down in
 * OKLCH lightness, highlights lift and cool slightly, so every tone keeps its own character
 * instead of being greyed by a black or white overlay.
 */
import { contrast, oklchToRgb, parseHex, rgbToOklch, toHex } from '../theme/colour';
import { pick } from './shapes';

export interface SkinTone {
  readonly name: string;
  readonly base: string;
  readonly shadow: string;
  readonly highlight: string;
  /** Upper lip and mouth corners. */
  readonly lipDark: string;
  /** Lower lip. */
  readonly lip: string;
}

function shift(hex: string, dl: number, cMul: number, dh: number): string {
  const o = rgbToOklch(parseHex(hex));
  return toHex(
    oklchToRgb({ l: Math.min(0.98, Math.max(0.05, o.l + dl)), c: o.c * cMul, h: o.h + dh }),
  );
}

/** Base skin colours from light to deep. */
const SKIN_BASES = [
  ['porcelain', '#F5D9C6'],
  ['fair', '#EDC6A8'],
  ['light', '#E2B28E'],
  ['light medium', '#D39E78'],
  ['medium', '#C28962'],
  ['tan', '#A9714B'],
  ['medium deep', '#8F5B3B'],
  ['deep', '#764A30'],
  ['very deep', '#5D3925'],
  ['ebony', '#45291B'],
] as const;

export const SKIN_TONES: readonly SkinTone[] = SKIN_BASES.map(([name, base], i) => {
  const deep = i / (SKIN_BASES.length - 1);
  return {
    name,
    base,
    shadow: shift(base, -0.075 + deep * 0.02, 1.1, -7),
    highlight: shift(base, 0.045 + deep * 0.02, 0.88 - deep * 0.1, 4),
    lip: shift(base, -0.06 + deep * 0.015, 1.25, -16),
    lipDark: shift(base, -0.13 + deep * 0.04, 1.3, -18),
  };
});

export interface HairTone {
  readonly name: string;
  readonly base: string;
  readonly dark: string;
  readonly light: string;
}

const HAIR_BASES = [
  ['black', '#1E1A18'],
  ['dark brown', '#3A2A20'],
  ['brown', '#5E4130'],
  ['auburn', '#7A3A22'],
  ['dark blonde', '#9A774D'],
  ['blonde', '#C9A66C'],
] as const;

export const HAIR_TONES: readonly HairTone[] = HAIR_BASES.map(([name, base]) => ({
  name,
  base,
  dark: shift(base, -0.06, 1.05, -4),
  light: shift(base, 0.09, 0.95, 3),
}));

export const skinTone = (i: number): SkinTone => pick(SKIN_TONES, i);
export const hairTone = (i: number): HairTone => pick(HAIR_TONES, i);

/** Fixed colours that are not tied to skin or team. */
export const INK = {
  /** Eye whites: warm, never pure white. */
  sclera: '#F6F1EA',
  iris: '#2A1C15',
  catchlight: '#FFFFFF',
  /** Upper lash line. */
  lash: '#1A1310',
  mouth: '#3D1C1C',
  teeth: '#F7F3EC',
  tongue: '#B4575A',
  gold: '#D2A640',
  goldLight: '#F0D27A',
  silver: '#C9CDD3',
  frame: '#26211F',
  frameTortoise: '#5C3B26',
  lens: '#FFFFFF',
  shirt: '#F4F2EE',
  shirtShadow: '#D9D5CD',
  blazer: '#2C3038',
  blazerDark: '#22252C',
  white: '#FFFFFF',
} as const;

/** Darkens or lightens a hex colour in OKLCH lightness. */
export const tone = (hex: string, dl: number): string => shift(hex, dl, 1, 0);

/** The jersey number colour: the secondary, unless it would not read on the primary. */
export function numberColour(primary: string, secondary: string): string {
  if (contrast(primary, secondary) >= 2.2) return secondary;
  return contrast(primary, '#FFFFFF') >= contrast(primary, '#141414') ? '#FFFFFF' : '#141414';
}

/** A valid #RRGGBB for any input (team colours come from content and are validated there). */
export function safeHex(hex: string, fallback: string): string {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex) ? toHex(parseHex(hex)) : fallback;
}
