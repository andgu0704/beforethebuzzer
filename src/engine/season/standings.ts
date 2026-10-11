import type { TeamId } from '../core/ids';
import { emptyRecord, type GameRecord, type TeamRecord } from '../model/game';
import type { CollegeTeam } from '../model/team';
import type { World } from '../model/world';
import { seasonOf } from '../core/calendar';

function recordFor(records: Record<string, TeamRecord>, id: TeamId): TeamRecord {
  const existing = records[id];
  if (existing) return existing;
  const created = emptyRecord();
  records[id] = created;
  return created;
}

/** Adds a finished league game to the season standings. Tournament games count too. */
export function recordResult(world: World, game: GameRecord): void {
  if (!game.result || (game.league !== 'college' && game.league !== 'pro')) return;
  const season = world.seasons[String(seasonOf(game.date))];
  if (!season) return;
  if (game.kind === 'exhibition' || game.kind === 'playoff' || game.kind === 'showcase') return;
  const records = game.league === 'college' ? season.college.records : season.pro.records;
  const home = recordFor(records, game.home);
  const away = recordFor(records, game.away);
  const homeWon = game.result.home > game.result.away;
  const conference =
    game.kind === 'conference' ||
    (game.league === 'pro' && sameProConference(world, game.home, game.away));
  apply(
    home,
    homeWon,
    game.result.home,
    game.result.away,
    conference && game.kind !== 'tournament',
    !game.neutral,
    true,
  );
  apply(
    away,
    !homeWon,
    game.result.away,
    game.result.home,
    conference && game.kind !== 'tournament',
    false,
    false,
  );
}

function sameProConference(world: World, a: TeamId, b: TeamId): boolean {
  const ta = world.teams[a];
  const tb = world.teams[b];
  return ta?.kind === 'pro' && tb?.kind === 'pro' && ta.conference === tb.conference;
}

function apply(
  r: TeamRecord,
  won: boolean,
  pf: number,
  pa: number,
  conference: boolean,
  home: boolean,
  isHome: boolean,
): void {
  if (won) r.w += 1;
  else r.l += 1;
  if (conference) {
    if (won) r.confW += 1;
    else r.confL += 1;
  }
  if (home && isHome) {
    if (won) r.homeW += 1;
    else r.homeL += 1;
  }
  r.pf += pf;
  r.pa += pa;
  r.streak = won ? Math.max(1, r.streak + 1) : Math.min(-1, r.streak - 1);
}

export function winPct(r: TeamRecord | undefined): number {
  if (!r || r.w + r.l === 0) return 0.5;
  return r.w / (r.w + r.l);
}

/** Conference standings, best first: conference record, then overall, then point margin. */
export function conferenceStandings(world: World, season: number, conferenceId: string): TeamId[] {
  const s = world.seasons[String(season)];
  const teams = Object.values(world.teams).filter(
    (t): t is CollegeTeam => t.kind === 'college' && t.conferenceId === conferenceId,
  );
  const rec = (id: TeamId) => s?.college.records[id] ?? emptyRecord();
  return teams
    .map((t) => t.id)
    .sort((a, b) => {
      const ra = rec(a);
      const rb = rec(b);
      const ca = ra.confW / Math.max(1, ra.confW + ra.confL);
      const cb = rb.confW / Math.max(1, rb.confW + rb.confL);
      return (
        cb - ca || winPct(rb) - winPct(ra) || rb.pf - rb.pa - (ra.pf - ra.pa) || (a < b ? -1 : 1)
      );
    });
}
