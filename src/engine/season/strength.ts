import type { TeamId } from '../core/ids';
import { overallOf } from '../game/ratings';
import { isPlayer } from '../model/person';
import type { World } from '../model/world';

/** Minutes-weighted rating of a team's top nine available players. */
export function teamRating(world: World, teamId: TeamId): number {
  const team = world.teams[teamId];
  if (!team) return 40;
  const ratings: number[] = [];
  for (const id of team.roster) {
    const p = world.people[id];
    if (!isPlayer(p) || (p.injury && p.injury.weeksLeft > 0)) continue;
    ratings.push(overallOf(p.skills, p.position, p.heightCm));
  }
  ratings.sort((a, b) => b - a);
  const weights = [1.2, 1.15, 1.1, 1.05, 1, 0.75, 0.6, 0.45, 0.3];
  let total = 0;
  let wsum = 0;
  weights.forEach((w, i) => {
    const r = ratings[i];
    if (r === undefined) return;
    total += r * w;
    wsum += w;
  });
  return wsum === 0 ? 40 : total / wsum;
}
