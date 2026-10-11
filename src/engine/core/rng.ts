/**
 * Deterministic random numbers. The engine never shares one global sequence: every
 * consumer derives its own stream from the world seed and a label, so adding a draw in
 * one system cannot shift the outcomes of another.
 */

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [min, max], inclusive. */
  int(min: number, max: number): number;
  /** True with the given probability. */
  chance(p: number): boolean;
  /** Approximately normal draw (sum of uniforms), clamped to ±4 standard deviations. */
  normal(mean: number, sd: number): number;
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: readonly T[], weight: (item: T) => number): T;
  shuffle<T>(items: readonly T[]): T[];
  /** A child stream, independent of this one's future draws. */
  fork(...label: readonly (string | number)[]): Rng;
}

export type Seed = readonly [number, number, number, number];

/** cyrb128: hashes a string into 128 bits of seed material. */
export function hashSeed(text: string): Seed {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < text.length; i++) {
    const k = text.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

function labelText(label: readonly (string | number)[]): string {
  return label.join('\u001f');
}

class Sfc32 implements Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(
    seed: Seed,
    private readonly base: string,
  ) {
    [this.a, this.b, this.c, this.d] = seed;
    for (let i = 0; i < 12; i++) this.nextUint();
  }

  private nextUint(): number {
    this.a >>>= 0;
    this.b >>>= 0;
    this.c >>>= 0;
    this.d >>>= 0;
    let t = (this.a + this.b) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.d = (this.d + 1) | 0;
    t = (t + this.d) | 0;
    this.c = (this.c + t) | 0;
    return t >>> 0;
  }

  next(): number {
    return this.nextUint() / 4294967296;
  }

  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  normal(mean: number, sd: number): number {
    let sum = 0;
    for (let i = 0; i < 6; i++) sum += this.next();
    // Sum of 6 uniforms has variance 0.5; rescale to unit variance.
    const z = (sum - 3) * 1.4142135623730951;
    return mean + sd * Math.max(-4, Math.min(4, z));
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('pick from empty list');
    return items[Math.floor(this.next() * items.length)] as T;
  }

  weighted<T>(items: readonly T[], weight: (item: T) => number): T {
    let total = 0;
    for (const item of items) total += Math.max(0, weight(item));
    if (items.length === 0 || total <= 0) throw new Error('weighted pick needs positive weights');
    let roll = this.next() * total;
    for (const item of items) {
      roll -= Math.max(0, weight(item));
      if (roll < 0) return item;
    }
    return items[items.length - 1] as T;
  }

  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = out[i] as T;
      out[i] = out[j] as T;
      out[j] = tmp;
    }
    return out;
  }

  fork(...label: readonly (string | number)[]): Rng {
    const salt = this.nextUint();
    return createRng(`${this.base}\u001e${String(salt)}`, ...label);
  }
}

/** A stream for `label` under the world seed. Same seed and label, same sequence. */
export function createRng(worldSeed: string, ...label: readonly (string | number)[]): Rng {
  const base = label.length === 0 ? worldSeed : `${worldSeed}\u001d${labelText(label)}`;
  return new Sfc32(hashSeed(base), base);
}
