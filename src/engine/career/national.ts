import { asInterruptId, nextId, type TournamentId } from '../core/ids';
import type { ContentIndex } from '../content/registry';
import { selectSquad } from '../international/selection';
import { changeStatus } from './effects';
import { socialReactions } from './social';
import { cause, msg, pushFeed, pushTimeline, userOf, type GameState } from './state';

/** After national squads are picked: if the user is in one, he is asked. */
export function raiseCallUps(state: GameState, tournamentIds: readonly TournamentId[]): void {
  const user = userOf(state);
  for (const id of tournamentIds) {
    const t = state.world.tournaments[id];
    if (!t) continue;
    const team = t.teams
      .map((teamId) => state.world.teams[teamId])
      .find((x) => x?.kind === 'national' && x.roster.includes(user.id));
    if (team?.kind !== 'national') continue;
    state.career.pending.push({
      id: asInterruptId(nextId(state.world.counters, 'interrupt', 'i')),
      kind: 'callUp',
      tournamentId: t.id,
      level: team.level,
    });
  }
}

export function resolveCallUp(
  state: GameState,
  index: ContentIndex,
  tournamentId: TournamentId,
  level: 'senior' | 'u20',
  accept: boolean,
): void {
  const career = state.career;
  const user = userOf(state);
  const why = cause(state, 'event', 'callUp', accept ? 'accept' : 'decline');
  career.callUps[tournamentId] = accept ? 'accepted' : 'declined';
  if (accept) {
    career.relations.nationalTeam = Math.min(100, career.relations.nationalTeam + 6);
    changeStatus(state, index, 'reputation', level === 'senior' ? 3 : 1);
    pushTimeline(
      state,
      msg(level === 'senior' ? 'timeline.seniorCallUp' : 'timeline.u20CallUp'),
      why,
      true,
    );
    pushFeed(state, 'milestone', msg(level === 'senior' ? 'feed.seniorCallUp' : 'feed.u20CallUp'));
    socialReactions(state, index, ['callUp'], `callup-${tournamentId}`, 2);
    return;
  }
  const nation = state.world.nations[user.nation];
  const teamId = level === 'senior' ? nation?.seniorTeam : nation?.u20Team;
  const team = teamId ? state.world.teams[teamId] : undefined;
  if (team)
    team.roster = selectSquad(state.world, {
      nation: user.nation,
      level,
      exclude: new Set([user.id]),
    }).map((p) => p.id);
  career.relations.nationalTeam = Math.max(0, career.relations.nationalTeam - 15);
  changeStatus(state, index, 'reputation', -3);
  career.flags['declined_national'] = { setAt: 0, cause: why };
  pushTimeline(state, msg('timeline.declinedCallUp'), why, true);
  pushFeed(state, 'news', msg('feed.declinedCallUp'));
}
