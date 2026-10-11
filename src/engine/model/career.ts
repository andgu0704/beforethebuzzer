import type { GameDate } from '../core/calendar';
import type { FeedId, GameId, InterruptId, PersonId, TeamId, TournamentId } from '../core/ids';
import type { CastRole, Feat, Relation } from '../content/story-types';
import type { LiveGame, Side } from '../game/types';
import type { Role } from '../game/prepare';
import type { Skill } from './skills';

// ------------------------------------------------------------------ messages

/** A reference resolved to a display name at render time, so renames apply everywhere. */
export type MessageParam =
  | string
  | number
  | { readonly person: PersonId; readonly part?: 'given' | 'family' }
  | { readonly team: TeamId; readonly part?: 'name' | 'nickname' | 'abbr' };

/** Text the engine wants shown. The UI turns the key into words; the engine never does. */
export interface Message {
  readonly key: string;
  readonly params?: Readonly<Record<string, MessageParam>>;
}

// ------------------------------------------------------------------ the weekly plan

export const PLAN_BLOCKS = 10;
export const ACTIVITIES = ['rest', 'film', 'bonding', 'study', 'media'] as const;
export type Activity = (typeof ACTIVITIES)[number];

export interface WeekPlan {
  readonly train: Readonly<Partial<Record<Skill, number>>>;
  readonly rest: number;
  readonly film: number;
  readonly bonding: number;
  readonly study: number;
  readonly media: number;
}

// ------------------------------------------------------------------ feed and timeline

export type FeedKind =
  | 'week'
  | 'game'
  | 'moment'
  | 'event'
  | 'social'
  | 'development'
  | 'milestone'
  | 'news'
  | 'injury'
  | 'draft';

export interface SocialPost {
  readonly template: string;
  readonly authorName: string;
  readonly handle: string;
  readonly likes: number;
  readonly replies: readonly ('gracious' | 'funny' | 'sharp')[];
  reply: 'gracious' | 'funny' | 'sharp' | 'ignored' | null;
}

export interface FeedEntry {
  readonly id: FeedId;
  readonly date: GameDate;
  readonly kind: FeedKind;
  readonly message: Message;
  readonly gameId?: GameId;
  readonly social?: SocialPost;
  /** Small structured payload for the UI (stat changes, scores). */
  readonly data?: Readonly<Record<string, number | string>>;
}

export interface Cause {
  readonly kind:
    'event' | 'moment' | 'plan' | 'game' | 'social' | 'consequence' | 'creation' | 'godMode';
  /** Content id (event id, moment id …) or game id. */
  readonly ref: string;
  /** Choice id, if any. */
  readonly choice?: string;
  readonly date: GameDate;
}

export interface FlagRecord {
  readonly setAt: number;
  readonly cause: Cause;
}

export interface ScheduledConsequence {
  readonly consequence: string;
  /** Absolute week index at which it is checked. */
  readonly due: number;
  readonly chance: number;
  readonly cause: Cause;
}

export interface TimelineEntry {
  readonly date: GameDate;
  readonly message: Message;
  readonly cause: Cause | null;
  /** Index of the timeline entry this one is an effect of. */
  readonly effectOf: number | null;
  readonly important: boolean;
}

// ------------------------------------------------------------------ recruiting, draft, agent

export interface Offer {
  readonly teamId: TeamId;
  /** Projected role and minutes as a freshman. */
  readonly role: 'bench' | 'rotation' | 'starter' | 'star';
  readonly minutes: number;
  readonly pitch: string;
}

export interface DraftProfile {
  declared: boolean;
  testingWaters: boolean;
  /** Projected range (best, worst), 61 meaning undrafted. */
  projected: [number, number];
  /** Board rank history, one per week. */
  history: { readonly date: GameDate; readonly rank: number }[];
  workouts: TeamId[];
  /** Team id → interest 0–100, moved by workouts and interviews. */
  interest: Record<string, number>;
}

export interface Deal {
  readonly brand: string;
  readonly kind: 'local' | 'drink' | 'apparel' | 'shoe' | 'game' | 'car';
  /** Dollars per week while active. */
  readonly weekly: number;
  /** Media blocks the deal expects each week. */
  readonly blocks: number;
  readonly endsWeek: number;
}

export interface GameMemory {
  readonly gameId: GameId;
  readonly date: GameDate;
  readonly won: boolean;
  /** Game score (a single-number summary of the stat line). */
  readonly score: number;
  /** Game score against the player's expectation for his role. */
  readonly vsExpected: number;
  readonly pts: number;
}

// ------------------------------------------------------------------ interrupts

export interface MomentSituation {
  readonly gameId: GameId;
  readonly period: number;
  readonly clock: number;
  readonly score: readonly [number, number];
  readonly userSide: Side;
  readonly offense: Side;
}

export type Interrupt =
  | {
      readonly id: InterruptId;
      readonly kind: 'keyMoment';
      readonly momentId: string;
      readonly options: readonly string[];
      readonly situation: MomentSituation;
    }
  | {
      readonly id: InterruptId;
      readonly kind: 'event';
      readonly eventId: string;
      readonly choices: readonly string[];
      readonly cast: Readonly<Partial<Record<CastRole, PersonId | TeamId>>>;
      readonly cause: Cause | null;
    }
  | { readonly id: InterruptId; readonly kind: 'offers'; readonly offers: readonly Offer[] }
  | {
      readonly id: InterruptId;
      readonly kind: 'callUp';
      readonly tournamentId: TournamentId;
      readonly level: 'senior' | 'u20';
    }
  | {
      readonly id: InterruptId;
      readonly kind: 'draftDecision';
      readonly options: readonly ('declare' | 'testWaters' | 'stay')[];
    }
  | { readonly id: InterruptId; readonly kind: 'withdraw' }
  | {
      readonly id: InterruptId;
      readonly kind: 'workouts';
      readonly teams: readonly TeamId[];
      readonly max: number;
    }
  | { readonly id: InterruptId; readonly kind: 'agent'; readonly agents: readonly PersonId[] }
  | { readonly id: InterruptId; readonly kind: 'draftNight' };

export type InterruptKind = Interrupt['kind'];

// ------------------------------------------------------------------ the turn cursor

export interface LiveUserGame {
  readonly gameId: GameId;
  readonly live: LiveGame;
  readonly userSide: Side;
  /** Seconds the player's moments may still use. */
  momentBudget: number;
  /** Set while waiting for the user to choose. */
  pendingMoment: { readonly momentId: string; readonly offense: Side } | null;
  readonly context: string;
  /** Why he is sitting this one out, if he is. */
  readonly absent: 'injured' | 'suspended' | 'ineligible' | null;
}

export interface TurnCursor {
  stage: 'idle' | 'games' | 'events' | 'wrap';
  /** The user's games this week, in order. */
  gameIds: GameId[];
  gameIndex: number;
  live: LiveUserGame | null;
  /** League games for the week have been played. */
  leagueDone: boolean;
  eventsDone: boolean;
}

// ------------------------------------------------------------------ the career

export type CareerStage =
  'highSchool' | 'college' | 'prospect' | 'drafted' | 'undrafted' | 'retired';

export interface Ending {
  readonly reason: 'draft' | 'undrafted' | 'injury' | 'choice';
  readonly date: GameDate;
  readonly pick: number | null;
  readonly teamId: TeamId | null;
}

export interface GodModeState {
  unlocked: boolean;
  forceNextMoment: 'success' | 'failure' | null;
  forceNextGame: 'win' | 'loss' | null;
  revealHidden: boolean;
  /** The team that will draft him, if God Mode chose one. */
  draftTeam: TeamId | null;
  /** Puts him on his national team at the next tournament, whatever the selectors think. */
  forceCallUp: boolean;
}

export interface Career {
  readonly playerId: PersonId;
  stage: CareerStage;
  /** Role the coach currently gives him. */
  role: Role;
  /** Draft-stock points from tournaments and events, on top of what scouts see. */
  stock: number;
  plan: WeekPlan;
  coachTrust: number;
  chemistry: number;
  reputation: number;
  money: number;
  gpa: number;
  relations: Record<Relation, number>;
  flags: Record<string, FlagRecord>;
  scheduled: ScheduledConsequence[];
  timeline: TimelineEntry[];
  feed: FeedEntry[];
  pending: Interrupt[];
  cursor: TurnCursor;
  /** Counts of past key-moment choices by action kind, used by simulate ahead. */
  tendencies: Record<string, number>;
  rivalId: PersonId | null;
  journalistId: PersonId | null;
  agentId: PersonId | null;
  agentOffers: PersonId[];
  deals: Deal[];
  feats: Record<Feat, number>;
  /** Recent games, newest last. */
  recent: GameMemory[];
  form: 'hot' | 'slump' | null;
  draft: DraftProfile;
  offers: Offer[];
  committedTo: TeamId | null;
  suspendedGames: number;
  ineligible: boolean;
  /** Event id → absolute week index it last fired. */
  eventLog: Record<string, number>;
  /** Signature move, once earned (a clip template id). */
  signature: string | null;
  /** Clip template id → successful uses, towards a signature move. */
  moveUses: Record<string, number>;
  /** National-team call-ups answered, by tournament. */
  callUps: Record<string, 'accepted' | 'declined'>;
  godMode: GodModeState;
  ending: Ending | null;
}
