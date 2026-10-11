import { collegePhase, weekIndex } from '../core/calendar';
import { asInterruptId, nextId, type PersonId, type TeamId } from '../core/ids';
import { createRng } from '../core/rng';
import type { ContentIndex } from '../content/registry';
import type { CastRole, EventDef } from '../content/story-types';
import type { Cause, Interrupt } from '../model/career';
import { isPlayer } from '../model/person';
import { applyEffects, type Change } from './effects';
import { meets } from './conditions';
import { cause, msg, pushFeed, pushTimeline, userTeamId, type GameState } from './state';

/** Chance that a week brings an event card, by how busy the week is. */
function eventChance(state: GameState): number {
  const phase = collegePhase(state.world.date.week);
  return phase === 'summer' || phase === 'spring' ? 0.5 : phase === 'preseason' ? 0.55 : 0.45;
}

function eligible(state: GameState, index: ContentIndex, e: EventDef): boolean {
  const last = state.career.eventLog[e.id];
  const now = weekIndex(state.world.date);
  if (last !== undefined) {
    if (e.once) return false;
    if (now - last < (e.cooldownWeeks ?? 12)) return false;
  }
  if (!meets(state, index, e.when)) return false;
  return e.choices.some((c) => meets(state, index, c.requires));
}

/** Fills the people an event's text refers to. */
export function castFor(
  state: GameState,
  e: EventDef,
): Partial<Record<CastRole, PersonId | TeamId>> {
  const out: Partial<Record<CastRole, PersonId | TeamId>> = {};
  const career = state.career;
  const teamId = userTeamId(state);
  const team = teamId ? state.world.teams[teamId] : undefined;
  const rng = createRng(state.world.seed, 'cast', e.id, weekIndex(state.world.date));
  for (const role of e.cast ?? []) {
    if (role === 'coach' && team?.coachId) out.coach = team.coachId;
    if (role === 'rival' && career.rivalId) out.rival = career.rivalId;
    if (role === 'journalist' && career.journalistId) out.journalist = career.journalistId;
    if (role === 'agent' && career.agentId) out.agent = career.agentId;
    if ((role === 'teammate' || role === 'starTeammate') && team) {
      const mates = team.roster.filter(
        (id) => id !== career.playerId && isPlayer(state.world.people[id]),
      );
      if (mates.length > 0) {
        if (role === 'teammate') out.teammate = rng.pick(mates);
        else {
          const best = [...mates].sort((a, b) => {
            const pa = state.world.people[a];
            const pb = state.world.people[b];
            const score = (p: typeof pa) =>
              isPlayer(p) ? Object.values(p.skills).reduce((s, v) => s + v, 0) : 0;
            return score(pb) - score(pa);
          })[0];
          if (best) out.starTeammate = best;
        }
      }
    }
    if (role === 'opponent') {
      const next = Object.values(state.world.games)
        .filter((g) => !g.result && teamId && (g.home === teamId || g.away === teamId))
        .sort((a, b) => weekIndex(a.date) - weekIndex(b.date) || a.slot - b.slot)[0];
      if (next && teamId) out.opponent = next.home === teamId ? next.away : next.home;
    }
  }
  return out;
}

/** Most weeks offer at most one event card. Returns the interrupt, already queued. */
export function maybeRaiseEvent(state: GameState, index: ContentIndex): Interrupt | null {
  const rng = createRng(state.world.seed, 'event', weekIndex(state.world.date));
  if (!rng.chance(eventChance(state))) return null;
  const options = index.content.events.filter((e) => eligible(state, index, e));
  if (options.length === 0) return null;
  const e = rng.weighted(options, (x) => x.weight);
  return raiseEvent(state, index, e, null);
}

export function raiseEvent(
  state: GameState,
  index: ContentIndex,
  e: EventDef,
  why: Cause | null,
): Interrupt {
  const interrupt: Interrupt = {
    id: asInterruptId(nextId(state.world.counters, 'interrupt', 'i')),
    kind: 'event',
    eventId: e.id,
    choices: e.choices.filter((c) => meets(state, index, c.requires)).map((c) => c.id),
    cast: castFor(state, e),
    cause: why,
  };
  state.career.eventLog[e.id] = weekIndex(state.world.date);
  state.career.pending.push(interrupt);
  return interrupt;
}

export interface EventOutcome {
  readonly changes: readonly Change[];
}

export function resolveEvent(
  state: GameState,
  index: ContentIndex,
  interrupt: Extract<Interrupt, { kind: 'event' }>,
  choiceId: string,
): EventOutcome {
  const e = index.event.get(interrupt.eventId);
  const choice = e?.choices.find((c) => c.id === choiceId);
  if (!e || !choice || !interrupt.choices.includes(choiceId))
    throw new Error(`invalid choice ${choiceId} for ${interrupt.eventId}`);
  const why = cause(state, 'event', e.id, choiceId);
  const rng = createRng(state.world.seed, 'eventOutcome', interrupt.id, choiceId);
  const changes = applyEffects(state, index, choice.effects, why, rng);
  const origin = interrupt.cause;
  const parent = origin
    ? state.career.timeline.findIndex(
        (t) => t.cause?.ref === origin.ref && t.cause.choice === origin.choice,
      )
    : -1;
  pushTimeline(
    state,
    msg(`events.${e.id}.choices.${choiceId}.timeline`),
    why,
    e.important !== false,
    parent >= 0 ? parent : null,
  );
  pushFeed(
    state,
    'event',
    msg(`events.${e.id}.choices.${choiceId}.outcome`, castParams(interrupt.cast)),
    {
      data: Object.fromEntries(
        changes
          .filter((c) => c.delta !== undefined)
          .map((c) => [`${c.kind}:${c.key}`, c.delta ?? 0]),
      ),
    },
  );
  return { changes };
}

export function castParams(
  cast: Partial<Record<CastRole, PersonId | TeamId>>,
): Record<string, { person: PersonId } | { team: TeamId }> {
  const out: Record<string, { person: PersonId } | { team: TeamId }> = {};
  for (const [role, id] of Object.entries(cast) as [CastRole, string][]) {
    out[role] = role === 'opponent' ? { team: id as TeamId } : { person: id as PersonId };
  }
  return out;
}

/** Fires delayed consequences that have come due. */
export function runConsequences(state: GameState, index: ContentIndex): void {
  const now = weekIndex(state.world.date);
  const due = state.career.scheduled.filter((s) => s.due <= now);
  state.career.scheduled = state.career.scheduled.filter((s) => s.due > now);
  for (const s of due) {
    const def = index.consequence.get(s.consequence);
    if (!def) continue;
    const rng = createRng(state.world.seed, 'consequence', s.consequence, s.due);
    if (!rng.chance(s.chance) || !meets(state, index, def.when)) continue;
    const why = cause(state, 'consequence', def.id);
    const parent = state.career.timeline.findIndex(
      (t) => t.cause?.ref === s.cause.ref && t.cause.choice === s.cause.choice,
    );
    applyEffects(state, index, def.effects, why, rng);
    pushTimeline(state, msg(`consequences.${def.id}`), s.cause, true, parent >= 0 ? parent : null);
    const followUp = def.event ? index.event.get(def.event) : undefined;
    if (followUp) raiseEvent(state, index, followUp, s.cause);
    else pushFeed(state, 'news', msg(`consequences.${def.id}`));
  }
}
