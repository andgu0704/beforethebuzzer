/** Shared portrait types: layers, expressions and the drawing context. */
import type { HairTone, SkinTone } from './colours';
import type { Frame, Head } from './head';

/** One flat shape: SVG path data in the 100×100 portrait box, filled with one colour. */
export interface Layer {
  /** Which part produced it ("hair", "eye.iris"…), for tests and debugging. */
  readonly part: string;
  readonly path: string;
  readonly color: string;
  readonly opacity?: number;
}

export const EXPRESSIONS = [
  'neutral',
  'smile',
  'focused',
  'frustrated',
  'stunned',
  'draft',
] as const;
export type Expression = (typeof EXPRESSIONS)[number];

export interface EyeExpr {
  /** Multiplies the upper-lid opening. */
  readonly open: number;
  /** 0–1: how far the lower lid rises (a smile pushes it up). */
  readonly raise: number;
  /** Upper-lid curve exponent: lower is flatter (a focused, narrowed look). */
  readonly lid: number;
  readonly irisScale: number;
  /** A wet glint on the lower lid (draft night). */
  readonly glint: boolean;
}

export interface BrowExpr {
  /** Moves the whole brow; negative is up. */
  readonly dy: number;
  /** Moves the inner end; positive pulls it down (a scowl), negative up (worry, emotion). */
  readonly inner: number;
  readonly arch: number;
  /** Pulls the inner ends towards the nose. */
  readonly knit: number;
}

export interface MouthExpr {
  readonly width: number;
  /** Corner lift; negative turns the corners up. */
  readonly corner: number;
  /** Opening above and below the lip line. */
  readonly openUp: number;
  readonly openDown: number;
  readonly kTop: number;
  readonly kBottom: number;
  /** Lip fullness multiplier: lips thin when pressed or stretched. */
  readonly press: number;
  readonly teeth: 'none' | 'upper' | 'full';
  readonly teethDepth: number;
  readonly tongue: boolean;
}

export interface ExprDef {
  readonly eye: EyeExpr;
  readonly brow: BrowExpr;
  readonly mouth: MouthExpr;
  /** Vertical creases between the brows. */
  readonly furrow: 0 | 1 | 2;
  readonly smileLines: boolean;
}

const closed = {
  openUp: 0,
  openDown: 0,
  kTop: 1,
  kBottom: 1,
  teeth: 'none',
  teethDepth: 0,
  tongue: false,
} as const;

export const EXPRESSION_DEFS: Readonly<Record<Expression, ExprDef>> = {
  neutral: {
    eye: { open: 1, raise: 0, lid: 0.8, irisScale: 1, glint: false },
    brow: { dy: 0, inner: 0, arch: 1, knit: 0 },
    mouth: { ...closed, width: 1, corner: 0, press: 1 },
    furrow: 0,
    smileLines: false,
  },
  smile: {
    eye: { open: 0.88, raise: 0.5, lid: 0.8, irisScale: 1, glint: false },
    brow: { dy: -0.45, inner: -0.1, arch: 1.1, knit: 0 },
    mouth: {
      width: 1.12,
      corner: -1.25,
      openUp: 0.1,
      openDown: 1.85,
      kTop: 1,
      kBottom: 0.8,
      press: 0.72,
      teeth: 'upper',
      teethDepth: 1.0,
      tongue: false,
    },
    furrow: 0,
    smileLines: true,
  },
  focused: {
    eye: { open: 0.7, raise: 0.22, lid: 0.45, irisScale: 1, glint: false },
    brow: { dy: 0.55, inner: 0.65, arch: 0.6, knit: 0.35 },
    mouth: { ...closed, width: 0.9, corner: 0.2, press: 0.62 },
    furrow: 1,
    smileLines: false,
  },
  frustrated: {
    eye: { open: 0.8, raise: 0.18, lid: 0.55, irisScale: 1, glint: false },
    brow: { dy: 0.35, inner: 1.25, arch: 0.45, knit: 0.5 },
    mouth: {
      width: 0.95,
      corner: 1.1,
      openUp: 0.35,
      openDown: 0.75,
      kTop: 0.8,
      kBottom: 0.8,
      press: 0.7,
      teeth: 'full',
      teethDepth: 0,
      tongue: false,
    },
    furrow: 2,
    smileLines: false,
  },
  stunned: {
    eye: { open: 1.4, raise: 0, lid: 0.9, irisScale: 0.88, glint: false },
    brow: { dy: -1.6, inner: -0.35, arch: 1.5, knit: 0 },
    mouth: {
      width: 0.52,
      corner: 0.1,
      openUp: 1.15,
      openDown: 2.5,
      kTop: 0.55,
      kBottom: 0.55,
      press: 0.85,
      teeth: 'upper',
      teethDepth: 0.55,
      tongue: true,
    },
    furrow: 0,
    smileLines: false,
  },
  draft: {
    eye: { open: 0.86, raise: 0.42, lid: 0.8, irisScale: 1, glint: true },
    brow: { dy: -0.55, inner: -0.95, arch: 0.85, knit: 0 },
    mouth: { ...closed, width: 1.1, corner: -1.05, press: 0.88 },
    furrow: 0,
    smileLines: true,
  },
};

/** What every part builder gets. */
export interface Ctx {
  readonly head: Head;
  readonly f: Frame;
  readonly skin: SkinTone;
  readonly hair: HairTone;
  readonly expr: ExprDef;
  readonly out: Layer[];
}

/** Appends a layer, dropping empty paths so every emitted layer draws something. */
export function add(
  out: Layer[],
  part: string,
  path: string,
  color: string,
  opacity?: number,
): void {
  if (path.length === 0) return;
  out.push({
    part,
    path,
    color,
    ...(opacity !== undefined && opacity < 1 ? { opacity } : {}),
  });
}
