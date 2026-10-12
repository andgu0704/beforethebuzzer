/**
 * Court geometry for the 2D clips (PLAN.md §12), in feet. The court is 94 × 50 with x along the
 * length and y across it; y = 0 is the top sideline as drawn. Plays are authored with the
 * offense attacking the right basket.
 */

export type CourtKind = 'college' | 'pro';

export const COURT_LENGTH = 94;
export const COURT_WIDTH = 50;
export const MID_Y = COURT_WIDTH / 2;
export const RIM_HEIGHT = 10;

export interface CourtGeometry {
  readonly kind: CourtKind;
  /** Hoop centre distance from the baseline. */
  readonly hoopInset: number;
  readonly rimRadius: number;
  /** Backboard face distance from the baseline. */
  readonly boardInset: number;
  readonly boardHalfWidth: number;
  readonly laneHalfWidth: number;
  /** Free-throw line distance from the baseline. */
  readonly ftInset: number;
  readonly ftRadius: number;
  readonly threeRadius: number;
  /** Distance from the hoop centre line to the straight corner three line. */
  readonly threeCorner: number;
  readonly restrictedRadius: number;
  readonly centreRadius: number;
}

const BASE = {
  hoopInset: 5.25,
  rimRadius: 0.75,
  boardInset: 4,
  boardHalfWidth: 3,
  ftInset: 19,
  ftRadius: 6,
  restrictedRadius: 4,
  centreRadius: 6,
} as const;

export const COURTS: Readonly<Record<CourtKind, CourtGeometry>> = {
  college: { ...BASE, kind: 'college', laneHalfWidth: 6, threeRadius: 22.146, threeCorner: 21.65 },
  pro: { ...BASE, kind: 'pro', laneHalfWidth: 8, threeRadius: 23.75, threeCorner: 22 },
};

/** The hoop the offense attacks in the authored frame. */
export const HOOP_X = COURT_LENGTH - BASE.hoopInset;
/** The other hoop, where turnovers run to. */
export const HOOP_X_LEFT = BASE.hoopInset;

/** How far from the hoop centre (along x) the corner line meets the arc. */
export function cornerDepth(geo: CourtGeometry): number {
  return Math.sqrt(geo.threeRadius * geo.threeRadius - geo.threeCorner * geo.threeCorner);
}

/** Whether a shot from (x, y) at the hoop at hoopX is worth three. */
export function isThree(geo: CourtGeometry, x: number, y: number, hoopX: number): boolean {
  const along = Math.abs(hoopX - x);
  const across = Math.abs(y - MID_Y);
  if (along <= cornerDepth(geo) || (hoopX > COURT_LENGTH / 2 ? x > hoopX : x < hoopX)) {
    return across > geo.threeCorner;
  }
  return Math.hypot(along, across) > geo.threeRadius;
}

/** Standard spots for the right basket, a little outside the lines so feet are behind them. */
export interface Spots {
  readonly top: readonly [number, number];
  readonly wingT: readonly [number, number];
  readonly wingB: readonly [number, number];
  readonly cornerT: readonly [number, number];
  readonly cornerB: readonly [number, number];
  readonly slotT: readonly [number, number];
  readonly slotB: readonly [number, number];
  readonly elbowT: readonly [number, number];
  readonly elbowB: readonly [number, number];
  readonly blockT: readonly [number, number];
  readonly blockB: readonly [number, number];
  readonly dunkerT: readonly [number, number];
  readonly dunkerB: readonly [number, number];
  readonly ftLine: readonly [number, number];
}

export function spotsFor(geo: CourtGeometry): Spots {
  const r = geo.threeRadius + 1.4;
  const d45 = r * Math.SQRT1_2;
  const lane = geo.laneHalfWidth;
  const cornerY = geo.threeCorner + 1.3;
  const slot = r + 0.4;
  return {
    top: [HOOP_X - r, MID_Y],
    wingT: [HOOP_X - d45, MID_Y - d45],
    wingB: [HOOP_X - d45, MID_Y + d45],
    cornerT: [91.6, MID_Y - cornerY],
    cornerB: [91.6, MID_Y + cornerY],
    slotT: [HOOP_X - slot * 0.92, MID_Y - slot * 0.39],
    slotB: [HOOP_X - slot * 0.92, MID_Y + slot * 0.39],
    elbowT: [COURT_LENGTH - geo.ftInset + 0.4, MID_Y - lane - 0.6],
    elbowB: [COURT_LENGTH - geo.ftInset + 0.4, MID_Y + lane + 0.6],
    blockT: [87.2, MID_Y - lane - 1.6],
    blockB: [87.2, MID_Y + lane + 1.6],
    dunkerT: [91.2, MID_Y - lane - 2.4],
    dunkerB: [91.2, MID_Y + lane + 2.4],
    ftLine: [COURT_LENGTH - geo.ftInset - 0.7, MID_Y],
  };
}
