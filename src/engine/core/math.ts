/**
 * Maths that gives bit-identical results on every JavaScript engine. `Math.exp`, `Math.log`
 * and `Math.pow` are only approximately specified, so Hermes (device) and V8 (Node scripts)
 * may disagree in the last bit. These versions use only + − × ÷, which IEEE 754 defines
 * exactly, so a seeded career plays out identically everywhere.
 */

const LN2 = 0.6931471805599453;

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Linear map of `value` from [inMin, inMax] onto [outMin, outMax], clamped. */
export function remap(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return outMin + (outMax - outMin) * t;
}

/** e^x for |x| ≤ 700, relative error below 1e-15. */
export function dexp(x: number): number {
  if (x > 700) return Infinity;
  if (x < -700) return 0;
  const k = Math.round(x / LN2);
  const r = x - k * LN2;
  // Taylor series for e^r with |r| ≤ ln2/2.
  let term = 1;
  let sum = 1;
  for (let n = 1; n <= 18; n++) {
    term = (term * r) / n;
    sum += term;
  }
  let scale = 1;
  const base = k >= 0 ? 2 : 0.5;
  for (let i = 0; i < Math.abs(k); i++) scale *= base;
  return sum * scale;
}

/** Natural logarithm for x > 0. */
export function dlog(x: number): number {
  if (!(x > 0)) return Number.NaN;
  let k = 0;
  let m = x;
  while (m >= 2) {
    m /= 2;
    k++;
  }
  while (m < 1) {
    m *= 2;
    k--;
  }
  // ln(m) = 2·atanh((m−1)/(m+1)), with m in [1, 2).
  const y = (m - 1) / (m + 1);
  const y2 = y * y;
  let term = y;
  let sum = 0;
  for (let n = 1; n <= 41; n += 2) {
    sum += term / n;
    term *= y2;
  }
  return 2 * sum + k * LN2;
}

/** base^exponent for base > 0. */
export function dpow(base: number, exponent: number): number {
  if (base === 0) return exponent === 0 ? 1 : 0;
  return dexp(exponent * dlog(base));
}

/** Logistic curve, 1 / (1 + e^−x). */
export function logistic(x: number): number {
  return 1 / (1 + dexp(-x));
}

/** Inverse logistic: the log-odds of p. */
export function logit(p: number): number {
  const q = clamp(p, 1e-9, 1 - 1e-9);
  return dlog(q / (1 - q));
}

/**
 * Shifts a base probability by `delta` in log-odds space. Keeps results inside (0, 1) and
 * makes the same rating edge matter less at the extremes, as it does on a court.
 */
export function shiftProbability(base: number, delta: number): number {
  return logistic(logit(base) + delta);
}

export function sum(values: readonly number[]): number {
  let total = 0;
  for (const v of values) total += v;
  return total;
}

export function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : sum(values) / values.length;
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Splits `total` into integers proportional to `weights` (largest remainder method), so
 * rounded parts always add back up to the total.
 */
export function apportion(total: number, weights: readonly number[]): number[] {
  const weightSum = sum(weights);
  if (weightSum <= 0) return weights.map(() => 0);
  const exact = weights.map((w) => (w / weightSum) * total);
  const floors = exact.map((v) => Math.floor(v));
  let remaining = total - sum(floors);
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (remaining <= 0) break;
    floors[i] = (floors[i] ?? 0) + 1;
    remaining--;
  }
  return floors;
}
