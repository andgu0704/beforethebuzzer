/**
 * Head shapes and the face frame. A head is described by a half-width profile `hw(y)`: a
 * superellipse dome from the crown to the cheekbones, then a jaw that narrows to the chin.
 * Hair, shading and beards are all derived from this profile, which is why a hairstyle sits
 * on every head shape instead of floating above it.
 */
import { clamp, mirror, type Pt, range } from './shapes';

export const CX = 50;

export interface HeadDef {
  readonly name: string;
  /** Half-width at the cheekbones. */
  readonly W: number;
  /** Half-width of the chin's flat. */
  readonly chinW: number;
  /** Jaw exponent: higher keeps the jaw wide for longer (square), lower tapers (heart). */
  readonly p: number;
  /** Dome superellipse exponent: 2 is an ellipse, higher is boxier. */
  readonly e: number;
  readonly top: number;
  readonly cheekY: number;
  readonly chinY: number;
  /** Which of the two ear shapes this head uses. */
  readonly ear: 0 | 1;
}

export const HEADS: readonly HeadDef[] = [
  { name: 'oval', W: 16.2, chinW: 5.2, p: 1.8, e: 2, top: 16, cheekY: 40, chinY: 60.5, ear: 0 },
  {
    name: 'round',
    W: 17.6,
    chinW: 7.6,
    p: 2.6,
    e: 2.1,
    top: 16.6,
    cheekY: 41,
    chinY: 59.4,
    ear: 1,
  },
  {
    name: 'square',
    W: 16.8,
    chinW: 9.6,
    p: 4,
    e: 2.5,
    top: 16,
    cheekY: 40,
    chinY: 60.6,
    ear: 0,
  },
  { name: 'long', W: 15, chinW: 5.8, p: 2.2, e: 2.1, top: 14.6, cheekY: 39.5, chinY: 62.6, ear: 1 },
  {
    name: 'heart',
    W: 17.2,
    chinW: 3.4,
    p: 1.25,
    e: 2.2,
    top: 16,
    cheekY: 39.5,
    chinY: 60.6,
    ear: 0,
  },
  {
    name: 'diamond',
    W: 17,
    chinW: 6.6,
    p: 2.1,
    e: 1.7,
    top: 15.4,
    cheekY: 42,
    chinY: 61,
    ear: 1,
  },
];

export class Head {
  readonly H: number;

  constructor(readonly d: HeadDef) {
    this.H = d.cheekY - d.top;
  }

  /** Half-width of the face at height y. */
  hw(y: number): number {
    const { W, chinW, p, e, top, cheekY, chinY } = this.d;
    if (y <= top) return 0;
    if (y <= cheekY) {
      const s = (cheekY - y) / this.H;
      return W * Math.max(0, 1 - s ** e) ** (1 / e);
    }
    if (y >= chinY) return chinW;
    const t = (y - cheekY) / (chinY - cheekY);
    return chinW + (W - chinW) * (1 - t ** p);
  }

  get chinDrop(): number {
    return Math.min(1.7, this.d.chinW * 0.32);
  }

  /** The lowest point of the face at horizontal offset dx from the centre line. */
  jawY(dx: number): number {
    const a = Math.abs(dx);
    const { chinW, W, cheekY, chinY } = this.d;
    if (a <= chinW) return chinY + this.chinDrop * (1 - (a / chinW) ** 2);
    if (a >= W) return cheekY;
    let lo = cheekY;
    let hi = chinY;
    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) / 2;
      if (this.hw(mid) > a) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /** A point on the dome grown outward by d; phi in [-π/2, π/2], 0 at the crown. */
  domePt(phi: number, d: number): Pt {
    const { e, cheekY, W } = this.d;
    const s = Math.abs(Math.sin(phi));
    const c = Math.max(0, Math.cos(phi));
    const x = (W + d) * s ** (2 / e) * Math.sign(phi);
    const y = cheekY - (this.H + d) * c ** (2 / e);
    return [CX + x, y];
  }

  /** Height of the dome surface (grown by d) above horizontal offset dx. */
  domeY(dx: number, d: number): number {
    const { e, cheekY, W } = this.d;
    const r = clamp(Math.abs(dx) / (W + d), 0, 1);
    return cheekY - (this.H + d) * (1 - r ** e) ** (1 / e);
  }

  /** The closed face outline, clockwise from the crown. */
  outline(): Pt[] {
    const { cheekY, chinY, chinW } = this.d;
    const right: Pt[] = [];
    for (const phi of range(0, Math.PI / 2, 30)) right.push(this.domePt(phi, 0));
    for (const y of range(cheekY, chinY, 22).slice(1)) right.push([CX + this.hw(y), y]);
    for (const x of range(chinW, 0, 10).slice(1)) right.push([CX + x, this.jawY(x)]);
    const left = mirror(right).reverse();
    return [...right, ...left.slice(1, -1)];
  }
}

/** Where the features sit on a given head. */
export interface Frame {
  readonly eyeY: number;
  readonly eyeDX: number;
  readonly browY: number;
  readonly noseY: number;
  readonly mouthY: number;
  readonly hairlineY: number;
  readonly templeY: number;
  readonly sideburnY: number;
  /** Neck half-width. */
  readonly neck: number;
}

export function frameFor(head: Head): Frame {
  const { top, chinY, W } = head.d;
  const eyeY = top + (chinY - top) * 0.515;
  const noseY = eyeY + (chinY - eyeY) * 0.4;
  return {
    eyeY,
    eyeDX: W * 0.445,
    browY: eyeY - 4.5,
    noseY,
    mouthY: noseY + (chinY - noseY) * 0.37,
    hairlineY: top + (eyeY - top) * 0.33,
    templeY: eyeY - 8,
    sideburnY: eyeY - 0.8,
    neck: clamp(W * 0.53, 7.8, 9),
  };
}
