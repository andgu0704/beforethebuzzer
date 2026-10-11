import { ageAt, seasonOf } from '../core/calendar';
import type { Rng } from '../core/rng';
import { isPlayer, type Player } from '../model/person';
import { SKILLS, type Skill } from '../model/skills';
import type { World } from '../model/world';
import { grow } from '../player/growth';

/** NPCs train a little of everything, skipping one skill at random each block of weeks. */
function npcPlan(rng: Rng): Partial<Record<Skill, number>> {
  const skip = rng.pick(SKILLS);
  const plan: Partial<Record<Skill, number>> = {};
  for (const s of SKILLS) if (s !== skip) plan[s] = 1;
  return plan;
}

function coachDevelopment(world: World, p: Player): number {
  const a = p.affiliation;
  if (a.kind !== 'college' && a.kind !== 'pro') return 45;
  const team = world.teams[a.teamId];
  const coach = team?.coachId ? world.people[team.coachId] : undefined;
  return coach?.kind === 'coach' ? coach.development : 45;
}

/** Applies `weeks` of development to every active non-user player. */
export function developNpcs(world: World, rng: Rng, weeks: number): void {
  const season = seasonOf(world.date);
  for (const person of Object.values(world.people)) {
    if (!isPlayer(person) || person.isUser) continue;
    const kind = person.affiliation.kind;
    if (kind === 'retired') continue;
    const line = person.lines.find((l) => l.season === season && !l.competition);
    const minutesPerWeek = line ? line.min / 20 : kind === 'pro' || kind === 'overseas' ? 40 : 0;
    person.skills = grow({
      skills: person.skills,
      ceiling: person.ceiling,
      age: ageAt(person.birthYear, world.date),
      train: npcPlan(rng),
      film: 1,
      gameMinutes: minutesPerWeek,
      coachDevelopment: coachDevelopment(world, person),
      growthRate: person.growthRate,
      traitGrowth: 1,
      traitSkill: {},
      fatigue: 0,
      weeks,
    });
  }
}

/** Weekly healing for everyone who is hurt. */
export function healInjuries(world: World): void {
  for (const person of Object.values(world.people)) {
    if (!isPlayer(person) || !person.injury) continue;
    person.injury.weeksLeft -= 1;
    if (person.injury.weeksLeft <= 0) person.injury = null;
  }
}
