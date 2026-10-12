/** The skill check's rules: which rating a move tests, how wide its zone is, how timing scores. */

import type { MomentAction } from '@/engine/content/story-types';
import { deriveRatings, type GameRatings } from '@/engine/game/ratings';
import type { Player } from '@/engine/model/person';

export type SkillKind = 'three' | 'mid' | 'rim' | 'post' | 'pass' | 'defend';

/** Which rating an action tests, or null for actions with nothing to time (playing hurt). */
export function skillFor(action: MomentAction): SkillKind | null {
  if (action.kind === 'shot') return action.shotType;
  if (action.kind === 'pass') return 'pass';
  if (action.kind === 'defend') return 'defend';
  return null;
}

export function ratingFor(p: Player, kind: SkillKind): number {
  const r: GameRatings = deriveRatings(p.skills, p.heightCm, p.wingspanCm);
  return Math.round(kind === 'defend' ? Math.max(r.perD, r.stl) : r[kind]);
}

/** Width of the sweet zone, as a share of the bar: wider the better he is at it. */
export function zoneWidth(rating: number): number {
  return 0.07 + (Math.max(1, Math.min(99, rating)) / 100) * 0.17;
}

/**
 * Timing quality from where the marker stopped: 1 dead centre, 0.75 at the zone's edge, falling
 * to 0 a third of the bar away.
 */
export function timingQuality(position: number, centre: number, width: number): number {
  const off = Math.abs(position - centre);
  const half = width / 2;
  if (off <= half) return 1 - (off / half) * 0.25;
  return Math.max(0, 0.75 - ((off - half) / 0.33) * 0.75);
}
