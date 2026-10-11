import type { GameDate } from '../core/calendar';
import { asFeedId, nextId, type PersonId, type TeamId } from '../core/ids';
import type { ContentIndex } from '../content/registry';
import type {
  Career,
  FeedEntry,
  FeedKind,
  Message,
  MessageParam,
  TimelineEntry,
  Cause,
} from '../model/career';
import { isPlayer, type Player } from '../model/person';
import type { World } from '../model/world';

export const SAVE_FORMAT = 1;

export interface SaveMeta {
  readonly saveId: string;
  readonly createdAt: GameDate;
  readonly contentVersion: string;
  readonly seed: string;
  integrity: { godMode: boolean; log: { readonly date: GameDate; readonly action: string }[] };
}

/** Everything that is saved: one world and the user's career in it. */
export interface GameState {
  readonly format: number;
  readonly meta: SaveMeta;
  readonly world: World;
  readonly career: Career;
}

/** What engine functions receive: the state they may change, and the content to read. */
export interface Session {
  readonly state: GameState;
  readonly index: ContentIndex;
}

export function userOf(state: GameState): Player {
  const p = state.world.people[state.career.playerId];
  if (!isPlayer(p)) throw new Error('the career has no player');
  return p;
}

export function userTeamId(state: GameState): TeamId | null {
  const a = userOf(state).affiliation;
  return a.kind === 'college' || a.kind === 'pro' ? a.teamId : null;
}

export function msg(key: string, params?: Record<string, MessageParam>): Message {
  return params ? { key, params } : { key };
}

export const personRef = (id: PersonId): MessageParam => ({ person: id });
export const teamRef = (id: TeamId): MessageParam => ({ team: id });

const FEED_LIMIT = 400;

export function pushFeed(
  state: GameState,
  kind: FeedKind,
  message: Message,
  extra: Partial<Omit<FeedEntry, 'id' | 'date' | 'kind' | 'message'>> = {},
): FeedEntry {
  const entry: FeedEntry = {
    id: asFeedId(nextId(state.world.counters, 'feed', 'f')),
    date: state.world.date,
    kind,
    message,
    ...extra,
  };
  state.career.feed.push(entry);
  if (state.career.feed.length > FEED_LIMIT)
    state.career.feed.splice(0, state.career.feed.length - FEED_LIMIT);
  return entry;
}

export function pushTimeline(
  state: GameState,
  message: Message,
  cause: Cause | null,
  important: boolean,
  effectOf: number | null = null,
): number {
  const entry: TimelineEntry = { date: state.world.date, message, cause, effectOf, important };
  state.career.timeline.push(entry);
  return state.career.timeline.length - 1;
}

export function cause(state: GameState, kind: Cause['kind'], ref: string, choice?: string): Cause {
  return choice === undefined
    ? { kind, ref, date: state.world.date }
    : { kind, ref, choice, date: state.world.date };
}
