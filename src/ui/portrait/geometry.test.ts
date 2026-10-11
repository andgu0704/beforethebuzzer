import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { Portrait } from '../../engine/model/person';
import { PORTRAIT_PARTS } from '../../engine/world/portrait';
import {
  ACCESSORY,
  EXPRESSIONS,
  type Layer,
  labFaces,
  normalisePortrait,
  portraitLayers,
  type PortraitOptions,
  randomPortrait,
  seededRandom,
} from './geometry';

const BASE: Portrait = {
  head: 0,
  skin: 0,
  eyes: 0,
  brows: 0,
  nose: 0,
  mouth: 0,
  hair: 0,
  hairColour: 0,
  facialHair: 0,
  accessory: 0,
};

const OPTS: PortraitOptions = {
  expression: 'neutral',
  jersey: 23,
  primary: '#14634A',
  secondary: '#F2F2F2',
};

/** Every coordinate in the path, as numbers. */
function coordinates(path: string): number[] {
  return (path.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

/** Problems with a layer list, empty when it is valid (one assertion keeps the tests fast). */
function problems(layers: readonly Layer[]): string[] {
  const out: string[] = [];
  if (layers.length < 10) out.push(`only ${layers.length} layers`);
  for (const layer of layers) {
    if (!/^M[^]*Z$/.test(layer.path)) out.push(`${layer.part}: malformed path`);
    if (/NaN|Infinity|undefined/.test(layer.path)) out.push(`${layer.part}: bad number`);
    if (!/^#[0-9A-F]{6}$/i.test(layer.color)) out.push(`${layer.part}: colour ${layer.color}`);
    // Hair and shoulders may run past the box edge, but never far.
    if (coordinates(layer.path).some((n) => !Number.isFinite(n) || n < -25 || n > 125)) {
      out.push(`${layer.part}: coordinate out of range`);
    }
    if (layer.opacity !== undefined && !(layer.opacity > 0 && layer.opacity <= 1)) {
      out.push(`${layer.part}: opacity ${layer.opacity}`);
    }
  }
  return out;
}

function expectValid(layers: readonly Layer[]): void {
  expect(problems(layers)).toEqual([]);
}

const partKeys = Object.keys(PORTRAIT_PARTS) as (keyof Portrait)[];

describe('portraitLayers', () => {
  it('draws every index of every part, for players and staff', () => {
    for (const key of partKeys) {
      for (let i = 0; i < PORTRAIT_PARTS[key]; i++) {
        for (const staff of [false, true]) {
          expectValid(portraitLayers({ ...BASE, [key]: i }, { ...OPTS, staff }));
        }
      }
    }
  }, 60_000);

  it('produces non-empty paths for any combination of parts, expression and colours', () => {
    const part = (n: number) => fc.integer({ min: 0, max: n - 1 });
    const portrait = fc.record({
      head: part(PORTRAIT_PARTS.head),
      skin: part(PORTRAIT_PARTS.skin),
      eyes: part(PORTRAIT_PARTS.eyes),
      brows: part(PORTRAIT_PARTS.brows),
      nose: part(PORTRAIT_PARTS.nose),
      mouth: part(PORTRAIT_PARTS.mouth),
      hair: part(PORTRAIT_PARTS.hair),
      hairColour: part(PORTRAIT_PARTS.hairColour),
      facialHair: part(PORTRAIT_PARTS.facialHair),
      accessory: part(PORTRAIT_PARTS.accessory),
    });
    const hex = fc
      .integer({ min: 0, max: 0xffffff })
      .map((n) => `#${n.toString(16).padStart(6, '0')}`);
    fc.assert(
      fc.property(
        portrait,
        fc.constantFrom(...EXPRESSIONS),
        fc.option(fc.integer({ min: 0, max: 99 }), { nil: undefined }),
        hex,
        hex,
        fc.boolean(),
        (p, expression, jersey, primary, secondary, staff) => {
          const layers = portraitLayers(p, {
            expression,
            primary,
            secondary,
            staff,
            ...(jersey !== undefined ? { jersey } : {}),
          });
          expectValid(layers);
        },
      ),
      { numRuns: 150 },
    );
  }, 60_000);

  it('changes eyes, brows and mouth between expressions, and nothing else', () => {
    const p: Portrait = { ...BASE, skin: 5, hair: 4, facialHair: 4 };
    const byExpression = EXPRESSIONS.map((expression) =>
      portraitLayers(p, { ...OPTS, expression }),
    );
    const signature = (layers: readonly Layer[]) =>
      layers
        .filter((l) => /^(eye|brows|mouth)/.test(l.part))
        .map((l) => l.path)
        .join('|');
    const signatures = new Set(byExpression.map(signature));
    expect(signatures.size).toBe(EXPRESSIONS.length);
    const fixed = (layers: readonly Layer[]) =>
      layers
        .filter((l) => ['head', 'ear', 'jersey', 'hair', 'nose.base'].includes(l.part))
        .map((l) => l.path)
        .join('|');
    const neutral = byExpression[0]!;
    for (const layers of byExpression) expect(fixed(layers)).toBe(fixed(neutral));
  });

  it('shows the jersey number only when given, and dresses staff in a blazer', () => {
    const parts = (o: PortraitOptions) => portraitLayers(BASE, o).map((l) => l.part);
    expect(parts(OPTS)).toContain('jersey.number');
    const { jersey: _omit, ...plain } = OPTS;
    expect(parts(plain)).not.toContain('jersey.number');
    const staff = parts({ ...OPTS, staff: true });
    expect(staff).toContain('blazer');
    expect(staff).not.toContain('jersey');
  });

  it('is deterministic', () => {
    const p = randomPortrait(seededRandom(9));
    expect(portraitLayers(p, OPTS)).toEqual(portraitLayers(p, OPTS));
  });
});

describe('normalisePortrait', () => {
  it('clamps out-of-range and non-integer indices', () => {
    const p = normalisePortrait({ ...BASE, head: 99, skin: -3, eyes: 2.7, hair: Number.NaN });
    expect(p.head).toBe(PORTRAIT_PARTS.head - 1);
    expect(p.skin).toBe(0);
    expect(p.eyes).toBe(2);
    expect(p.hair).toBe(0);
  });

  it('drops a headband from a top knot, a quiff and a horseshoe', () => {
    for (const hair of [10, 16, 17]) {
      expect(normalisePortrait({ ...BASE, hair, accessory: ACCESSORY.headband }).accessory).toBe(0);
    }
    expect(normalisePortrait({ ...BASE, hair: 9, accessory: ACCESSORY.headband }).accessory).toBe(
      ACCESSORY.headband,
    );
  });

  it('replaces earrings hidden by long hair', () => {
    expect(normalisePortrait({ ...BASE, hair: 11, accessory: ACCESSORY.earrings }).accessory).toBe(
      ACCESSORY.chain,
    );
    expect(
      normalisePortrait({ ...BASE, hair: 7, accessory: ACCESSORY.earrings }, true).accessory,
    ).toBe(0);
  });
});

describe('labFaces', () => {
  it('is seeded and in range', () => {
    const a = labFaces(4, 40, [{ primary: '#112233', secondary: '#FFCC00' }]);
    expect(a).toEqual(labFaces(4, 40, [{ primary: '#112233', secondary: '#FFCC00' }]));
    for (const { portrait } of a) {
      for (const key of partKeys) {
        expect(portrait[key]).toBeGreaterThanOrEqual(0);
        expect(portrait[key]).toBeLessThan(PORTRAIT_PARTS[key]);
      }
    }
  });
});
