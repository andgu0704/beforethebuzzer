import type { PersonId, TeamId } from '../core/ids';
import { production } from '../draft/scouting';
import { isPlayer, type Player, type SeasonLine } from '../model/person';
import type { AwardEntry, World } from '../model/world';
import { winPct } from './standings';

interface Candidate {
  readonly id: PersonId;
  readonly team: TeamId;
  readonly score: number;
  readonly line: SeasonLine;
  readonly player: Player;
}

function candidates(world: World, season: number, league: 'college' | 'pro'): Candidate[] {
  const s = world.seasons[String(season)];
  const out: Candidate[] = [];
  for (const person of Object.values(world.people)) {
    if (!isPlayer(person)) continue;
    const line = person.lines.find(
      (l) => l.season === season && l.league === league && !l.competition,
    );
    if (!line || line.gp < 10) continue;
    const prod = production([line]);
    const minutesShare = Math.min(1, line.min / line.gp / 32);
    const records = league === 'college' ? s?.college.records : s?.pro.records;
    const team = line.team as TeamId;
    const success = winPct(records?.[team]);
    const ppg = line.pts / line.gp;
    out.push({
      id: person.id,
      team,
      score: prod.score * minutesShare + success * 12 + ppg * 0.4,
      line,
      player: person,
    });
  }
  return out.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
}

export function collegeAwards(
  world: World,
  season: number,
  conferenceOf: (team: TeamId) => string | null,
): AwardEntry[] {
  const list = candidates(world, season, 'college');
  const awards: AwardEntry[] = [];
  const first = list[0];
  if (first)
    awards.push({ kind: 'nationalPoy', personId: first.id, teamId: first.team, scope: null });
  list
    .slice(0, 5)
    .forEach((c) =>
      awards.push({ kind: 'allAmericanFirst', personId: c.id, teamId: c.team, scope: null }),
    );
  list
    .slice(5, 10)
    .forEach((c) =>
      awards.push({ kind: 'allAmericanSecond', personId: c.id, teamId: c.team, scope: null }),
    );
  const freshman = list.find(
    (c) => c.player.affiliation.kind === 'college' && c.player.affiliation.classYear === 1,
  );
  if (freshman)
    awards.push({
      kind: 'freshmanOfYear',
      personId: freshman.id,
      teamId: freshman.team,
      scope: null,
    });
  const byConference = new Map<string, Candidate[]>();
  for (const c of list) {
    const conf = conferenceOf(c.team);
    if (!conf) continue;
    const arr = byConference.get(conf) ?? [];
    arr.push(c);
    byConference.set(conf, arr);
  }
  for (const [conf, arr] of byConference) {
    const best = arr[0];
    if (best)
      awards.push({ kind: 'conferencePoy', personId: best.id, teamId: best.team, scope: conf });
    arr
      .slice(0, 5)
      .forEach((c) =>
        awards.push({ kind: 'allConference', personId: c.id, teamId: c.team, scope: conf }),
      );
  }
  return awards;
}

/** Most outstanding player of a tournament: the best of the champion's players by the season's form. */
export function tournamentStar(
  world: World,
  season: number,
  champion: TeamId,
  league: 'college' | 'pro' | 'national',
  competition?: string,
): PersonId | null {
  let best: { id: PersonId; score: number } | null = null;
  for (const id of world.teams[champion]?.roster ?? []) {
    const p = world.people[id];
    if (!isPlayer(p)) continue;
    const lines = p.lines.filter(
      (l) =>
        l.season === season &&
        l.league === league &&
        (competition === undefined || l.competition === competition),
    );
    const prod = production(lines);
    const score = prod.score * Math.min(1, prod.minutes / Math.max(1, prod.games) / 30);
    if (!best || score > best.score) best = { id, score };
  }
  return best?.id ?? null;
}

export function proAwards(world: World, season: number): AwardEntry[] {
  const list = candidates(world, season, 'pro');
  const awards: AwardEntry[] = [];
  const mvp = list[0];
  if (mvp) awards.push({ kind: 'proMvp', personId: mvp.id, teamId: mvp.team, scope: null });
  const rookie = list.find((c) => c.player.draft?.season === season - 1);
  if (rookie)
    awards.push({ kind: 'proRookie', personId: rookie.id, teamId: rookie.team, scope: null });
  return awards;
}
