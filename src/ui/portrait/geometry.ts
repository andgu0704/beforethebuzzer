/**
 * The portrait geometry (PLAN.md §10.6): a pure function from a person's portrait parts and
 * an expression to a list of flat, filled layers in a 100×100 box. No React and no Skia, so
 * the same layers render in the app (Skia), headless in Node (the review sheets) and as SVG.
 *
 * Art direction, enforced here rather than per drawing: flat shapes, no outlines, no
 * gradients; each skin tone has one base, one shadow and one highlight; light from the upper
 * left; a head-and-shoulders crop with the collar and number in team colours.
 */
import type { Portrait } from '../../engine/model/person';
import { PORTRAIT_PARTS } from '../../engine/world/portrait';
import { hairTone, safeHex, skinTone, tone } from './colours';
import { chain, jersey, neckShadow, staffClothes, torso } from './body';
import { beard, earrings, glasses, headband, moustache } from './extras';
import {
  BROWS,
  brows,
  ears,
  EYES,
  eyes,
  faceShading,
  mouth,
  MOUTHS,
  mouthShape,
  nose,
  NOSES,
  underLip,
} from './features';
import { hairBack, hairFront, HORSESHOE, LONG_STYLES, QUIFF, sideburnFor, TOP_KNOT } from './hair';
import { frameFor, Head, HEADS } from './head';
import { num, pick, poly } from './shapes';
import { add, type Ctx, EXPRESSION_DEFS, EXPRESSIONS, type Expression, type Layer } from './types';

export { EXPRESSIONS, type Expression, type Layer } from './types';
export { HAIR_NAMES } from './hair';
export { ACCESSORY_NAMES, FACIAL_HAIR_NAMES, STAFF_ACCESSORY_NAMES } from './extras';
export { HAIR_TONES, SKIN_TONES } from './colours';

export interface PortraitOptions {
  readonly expression: Expression;
  /** Jersey number 0–99; omitted, the jersey is plain. Ignored for staff. */
  readonly jersey?: number;
  /** Team colours as #RRGGBB. */
  readonly primary: string;
  readonly secondary: string;
  /** Coaches, agents, journalists: shirt and blazer instead of a jersey; glasses allowed. */
  readonly staff?: boolean;
}

/** Display names per part index, for the parts sheet and the creation "Look" step. */
export const PART_NAMES = {
  head: HEADS.map((h) => h.name),
  eyes: EYES.map((e) => e.name),
  brows: BROWS.map((b) => b.name),
  nose: NOSES.map((n) => n.name),
  mouth: MOUTHS.map((m) => m.name),
} as const;

/** Accessory indices (index 0 is always none). */
export const ACCESSORY = { none: 0, headband: 1, earrings: 2, chain: 3 } as const;
export const STAFF_ACCESSORY = { none: 0, glasses: 1, earrings: 2, roundGlasses: 3 } as const;

/**
 * Brings any stored portrait into range and removes part pairs that look wrong together.
 * Out-of-range or non-integer indices are clamped (a save from a future art set still draws).
 *
 * Excluded pairs, each resolved by dropping the accessory so the person keeps their face:
 * - top knot + headband: the band would cut through the slicked hair that leads to the bun;
 * - quiff + headband: the band would flatten the quiff's lift;
 * - horseshoe (bald on top) + headband: reads as a costume rather than a person;
 * - locs or long hair + earrings: the hair covers the ears, so the earrings would vanish;
 *   players get the chain instead (the accessory roll still shows), staff get nothing.
 */
export function normalisePortrait(p: Portrait, staff = false): Portrait {
  const fix = (v: number, n: number) =>
    Number.isFinite(v) ? Math.min(n - 1, Math.max(0, Math.floor(v))) : 0;
  const out = {
    head: fix(p.head, PORTRAIT_PARTS.head),
    skin: fix(p.skin, PORTRAIT_PARTS.skin),
    eyes: fix(p.eyes, PORTRAIT_PARTS.eyes),
    brows: fix(p.brows, PORTRAIT_PARTS.brows),
    nose: fix(p.nose, PORTRAIT_PARTS.nose),
    mouth: fix(p.mouth, PORTRAIT_PARTS.mouth),
    hair: fix(p.hair, PORTRAIT_PARTS.hair),
    hairColour: fix(p.hairColour, PORTRAIT_PARTS.hairColour),
    facialHair: fix(p.facialHair, PORTRAIT_PARTS.facialHair),
    accessory: fix(p.accessory, PORTRAIT_PARTS.accessory),
  };
  if (!staff && out.accessory === ACCESSORY.headband) {
    if (out.hair === TOP_KNOT || out.hair === QUIFF || out.hair === HORSESHOE) out.accessory = 0;
  }
  if (out.accessory === ACCESSORY.earrings && LONG_STYLES.includes(out.hair)) {
    out.accessory = staff ? 0 : ACCESSORY.chain;
  }
  return out;
}

/** The layers of one portrait, back to front. */
export function portraitLayers(portrait: Portrait, opts: PortraitOptions): Layer[] {
  const staff = opts.staff === true;
  const p = normalisePortrait(portrait, staff);
  const primary = safeHex(opts.primary, '#3A3A3A');
  const secondary = safeHex(opts.secondary, '#F2F2F2');
  const head = new Head(pick(HEADS, p.head));
  const out: Layer[] = [];
  const ctx: Ctx = {
    head,
    f: frameFor(head),
    skin: skinTone(p.skin),
    hair: hairTone(p.hairColour),
    expr: EXPRESSION_DEFS[opts.expression],
    out,
  };
  const eyeDef = pick(EYES, p.eyes);
  const shape = mouthShape(ctx, pick(MOUTHS, p.mouth));

  hairBack(ctx, p.hair);
  const bodyFrom = out.length;
  torso(ctx);
  if (staff) staffClothes(ctx, primary, secondary);
  else jersey(ctx, primary, secondary, opts.jersey);
  if (!staff && p.accessory === ACCESSORY.chain) chain(ctx);
  const bodyTo = out.length;

  // The beard's volume decides how far the jaw's shadow falls on the neck; the shadow is
  // drawn first and the beard later, over the face.
  const beardLayers: Layer[] = [];
  const beardCtx: Ctx = { ...ctx, out: beardLayers };
  const sideburn = sideburnFor(p.hair, ctx);
  const { extra } = beard(beardCtx, p.facialHair, sideburn, shape);
  neckShadow(ctx, extra);

  ears(ctx);
  if (p.accessory === ACCESSORY.earrings) earrings(ctx);
  add(out, 'head', poly(head.outline()), ctx.skin.base);
  faceShading(ctx);
  underLip(ctx, shape);
  out.push(...beardLayers);
  eyes(ctx, eyeDef);
  brows(ctx, pick(BROWS, p.brows), eyeDef, browColour(ctx.hair.base, p.hairColour));
  nose(ctx, pick(NOSES, p.nose));
  mouth(ctx, shape);
  moustache(ctx, p.facialHair, shape);
  hairFront(ctx, p.hair);
  if (!staff && p.accessory === ACCESSORY.headband) headband(ctx, primary);
  if (
    staff &&
    (p.accessory === STAFF_ACCESSORY.glasses || p.accessory === STAFF_ACCESSORY.roundGlasses)
  ) {
    glasses(ctx, eyeDef, p.accessory === STAFF_ACCESSORY.roundGlasses);
  }
  return out.map((layer, i) => ({
    ...layer,
    path: place(layer.path, i >= bodyFrom && i < bodyTo ? BODY_LIFT : 0),
  }));
}

/**
 * Parts are modelled at a comfortable working scale; the finished portrait is enlarged about
 * the box centre so the face fills an avatar, and the shoulders are lifted to keep the neck
 * short. All paths are absolute M/L/Z polygons, so this is a plain map over coordinate pairs.
 */
const VIEW_SCALE = 1.16;
const BODY_LIFT = -4;

function place(path: string, dy: number): string {
  return path.replace(
    /(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g,
    (_m, x: string, y: string) =>
      `${num(50 + (Number(x) - 50) * VIEW_SCALE)} ${num(50 + (Number(y) + dy - 50) * VIEW_SCALE)}`,
  );
}

/** Fair hair gets slightly darker brows, as it does in life. */
function browColour(hair: string, index: number): string {
  return index >= 4 ? tone(hair, -0.14) : hair;
}

// ---------------------------------------------------------------- random portraits

/** A small seeded generator (mulberry32) for the portrait lab and the review sheets. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A random portrait with every skin tone equally likely (the lab should show the whole range;
 * the engine's own generator weights skin by nation). Facial hair and accessories follow the
 * engine's odds.
 */
export function randomPortrait(next: () => number): Portrait {
  const int = (n: number) => Math.min(n - 1, Math.floor(next() * n));
  const hairColourRoll = next() * 13;
  return {
    head: int(PORTRAIT_PARTS.head),
    skin: int(PORTRAIT_PARTS.skin),
    eyes: int(PORTRAIT_PARTS.eyes),
    brows: int(PORTRAIT_PARTS.brows),
    nose: int(PORTRAIT_PARTS.nose),
    mouth: int(PORTRAIT_PARTS.mouth),
    hair: int(PORTRAIT_PARTS.hair),
    hairColour: hairColourRoll < 6 ? 0 : hairColourRoll < 9 ? 1 : 2 + int(4),
    facialHair: next() < 0.55 ? 0 : 1 + int(PORTRAIT_PARTS.facialHair - 1),
    accessory: next() < 0.8 ? 0 : 1 + int(PORTRAIT_PARTS.accessory - 1),
  };
}

/**
 * How a portrait is framed at a given size in points. Small avatars zoom in on the face so it
 * stays readable at 32 pt; from 64 pt up the full head-and-shoulders crop shows. The box point
 * (cx, cy) goes to the centre of the view, enlarged by `scale`.
 */
export function framingFor(size: number): { scale: number; cx: number; cy: number } {
  if (size <= 40) return { scale: 1.32, cx: 50, cy: 45 };
  if (size < 64) return { scale: 1.14, cx: 50, cy: 47.5 };
  return { scale: 1, cx: 50, cy: 50 };
}

export interface TeamColours {
  readonly primary: string;
  readonly secondary: string;
}

export interface LabFace {
  readonly portrait: Portrait;
  readonly opts: PortraitOptions;
}

const DEFAULT_TEAM: TeamColours = { primary: '#14634A', secondary: '#F2F2F2' };

/**
 * Seeded random faces for the portrait lab and the review sheets: mostly neutral with some of
 * every other expression, every eighth one a staff member, team colours drawn from `teams`.
 */
export function labFaces(seed: number, count: number, teams: readonly TeamColours[]): LabFace[] {
  const next = seededRandom(seed);
  const faces: LabFace[] = [];
  for (let i = 0; i < count; i++) {
    const neutral = next() < 0.55;
    const expression: Expression = neutral
      ? 'neutral'
      : pick(EXPRESSIONS, Math.floor(next() * EXPRESSIONS.length));
    const portrait = randomPortrait(next);
    const jersey = Math.floor(next() * 56);
    const team = teams.length > 0 ? pick(teams, Math.floor(next() * teams.length)) : DEFAULT_TEAM;
    faces.push({
      portrait,
      opts: {
        expression,
        jersey,
        staff: i % 8 === 7,
        primary: team.primary,
        secondary: team.secondary,
      },
    });
  }
  return faces;
}
