import { seasonOf } from '@/engine/core/calendar';
import type { Player, SeasonLine } from '@/engine/model/person';
import type { World } from '@/engine/model/world';

export interface PerGame {
  readonly gp: number;
  readonly pts: number;
  readonly reb: number;
  readonly ast: number;
  readonly stl: number;
  readonly blk: number;
  readonly min: number;
  readonly fgPct: number;
  readonly tpPct: number;
  readonly ftPct: number;
}

export function perGame(lines: readonly SeasonLine[]): PerGame {
  const sum = (k: keyof SeasonLine) => lines.reduce((s, l) => s + Number(l[k]), 0);
  const gp = sum('gp');
  const d = Math.max(1, gp);
  const fga = sum('fga');
  const tpa = sum('tpa');
  const fta = sum('fta');
  return {
    gp,
    pts: sum('pts') / d,
    reb: (sum('orb') + sum('drb')) / d,
    ast: sum('ast') / d,
    stl: sum('stl') / d,
    blk: sum('blk') / d,
    min: sum('min') / d / 60,
    fgPct: fga ? sum('fgm') / fga : 0,
    tpPct: tpa ? sum('tpm') / tpa : 0,
    ftPct: fta ? sum('ftm') / fta : 0,
  };
}

/** His lines this season in his main league (college or pro), not national teams. */
export function seasonLines(world: World, p: Player): SeasonLine[] {
  const season = seasonOf(world.date);
  return p.lines.filter((l) => l.season === season && l.league !== 'national' && !l.competition);
}

export const one = (n: number) => n.toFixed(1);
export const pct = (n: number) => (n * 100).toFixed(1);
