import { addWeeks, PRO_REGULAR_SEASON_WEEKS, WEEK } from '../core/calendar';
import type { TeamId } from '../core/ids';
import type { Rng } from '../core/rng';
import type { ProTeam } from '../model/team';
import type { World } from '../model/world';
import { createGame } from '../world/games';

export const PRO_GAMES = 82;
const SLOTS_PER_WEEK = 4;

/** Games each pair meets: 4 in the division, 3 or 4 in the conference, 2 across. */
function matchups(teams: ProTeam[], rng: Rng): Map<string, number> {
  const counts = new Map<string, number>();
  const key = (a: ProTeam, b: ProTeam) => `${a.id}|${b.id}`;
  for (const conference of ['east', 'west'] as const) {
    const conf = teams.filter((t) => t.conference === conference);
    // Each team plays exactly four non-division conference opponents three times: two in each
    // other division, chosen by a rotating offset so the counts balance.
    const threeGames = new Set<string>();
    const divisions = [...new Set(conf.map((t) => t.division))].sort();
    const byDivision = divisions.map((d) => rng.shuffle(conf.filter((t) => t.division === d)));
    for (let x = 0; x < byDivision.length; x++) {
      for (let y = x + 1; y < byDivision.length; y++) {
        const dx = byDivision[x] ?? [];
        const dy = byDivision[y] ?? [];
        dx.forEach((t, i) => {
          for (const offset of [0, 1]) {
            const o = dy[(i + offset) % dy.length];
            if (o) threeGames.add(t.id < o.id ? key(t, o) : key(o, t));
          }
        });
      }
    }
    for (const a of conf) {
      for (const b of conf) {
        if (a.id >= b.id) continue;
        counts.set(key(a, b), a.division === b.division ? 4 : threeGames.has(key(a, b)) ? 3 : 4);
      }
    }
  }
  for (const a of teams)
    for (const b of teams)
      if (a.id < b.id && a.conference !== b.conference) counts.set(key(a, b), 2);
  return counts;
}

/** Spreads 82 games per team over the regular-season weeks, at most one game per team per slot. */
export function scheduleProSeason(world: World, season: number, rng: Rng): void {
  const teams = Object.values(world.teams).filter((t): t is ProTeam => t.kind === 'pro');
  const counts = matchups(teams, rng);
  const pairs: { a: TeamId; b: TeamId; left: number; homeA: number }[] = [];
  for (const [k, n] of counts) {
    const [a, b] = k.split('|') as [TeamId, TeamId];
    pairs.push({
      a,
      b,
      left: n,
      homeA: n % 2 === 0 ? n / 2 : rng.chance(0.5) ? Math.ceil(n / 2) : Math.floor(n / 2),
    });
  }
  const remaining = new Map<TeamId, number>(teams.map((t) => [t.id, 0]));
  for (const p of pairs) {
    remaining.set(p.a, (remaining.get(p.a) ?? 0) + p.left);
    remaining.set(p.b, (remaining.get(p.b) ?? 0) + p.left);
  }
  const start = { year: season - 1, week: WEEK.proSeasonStart };
  const totalSlots = PRO_REGULAR_SEASON_WEEKS * SLOTS_PER_WEEK;
  for (let s = 0; s < totalSlots + 40; s++) {
    const slotsLeft = Math.max(1, totalSlots - s);
    const playing = new Set<TeamId>();
    const candidates = rng.shuffle(teams.map((t) => t.id)).filter((id) => {
      const left = remaining.get(id) ?? 0;
      return left > 0 && (s >= totalSlots || rng.next() < left / slotsLeft + 0.05);
    });
    for (const t of candidates) {
      if (playing.has(t)) continue;
      const options = pairs.filter(
        (p) =>
          p.left > 0 &&
          (p.a === t || p.b === t) &&
          !playing.has(p.a === t ? p.b : p.a) &&
          candidates.includes(p.a === t ? p.b : p.a),
      );
      if (options.length === 0) continue;
      const best = options.reduce((x, y) => (y.left > x.left ? y : x));
      const other = best.a === t ? best.b : best.a;
      playing.add(t);
      playing.add(other);
      const homeIsA = best.homeA > 0 && (best.left - best.homeA === 0 || rng.chance(0.5));
      if (homeIsA) best.homeA -= 1;
      best.left -= 1;
      remaining.set(best.a, (remaining.get(best.a) ?? 0) - 1);
      remaining.set(best.b, (remaining.get(best.b) ?? 0) - 1);
      const week = Math.min(Math.floor(s / SLOTS_PER_WEEK), PRO_REGULAR_SEASON_WEEKS - 1);
      createGame(world, {
        date: addWeeks(start, week),
        slot: s < totalSlots ? s % SLOTS_PER_WEEK : SLOTS_PER_WEEK + (s - totalSlots),
        league: 'pro',
        kind: 'regular',
        home: homeIsA ? best.a : best.b,
        away: homeIsA ? best.b : best.a,
      });
    }
    if ([...remaining.values()].every((v) => v <= 0)) break;
  }
}
