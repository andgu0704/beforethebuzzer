/**
 * Shapes of the story content: traits, events, consequences, key moments and social posts.
 * Text never lives here; every id maps to strings in the locale catalogs.
 */

import type { CollegePhase } from '../core/calendar';
import type { Role } from '../game/prepare';
import type { ShotType } from '../game/types';
import type { PlayStyle, Position, Skill } from '../model/skills';

// ------------------------------------------------------------------ status and relations

export const STATUS_KEYS = [
  'energy',
  'health',
  'confidence',
  'coachTrust',
  'chemistry',
  'reputation',
  'money',
  'gpa',
] as const;
export type StatusKey = (typeof STATUS_KEYS)[number];

export const RELATIONS = [
  'coach',
  'teammates',
  'journalist',
  'rival',
  'agent',
  'fans',
  'family',
  'nationalTeam',
] as const;
export type Relation = (typeof RELATIONS)[number];

// ------------------------------------------------------------------ feats and traits

export const FEATS = [
  'gameWinners',
  'clutchMisses',
  'thirtyPointGames',
  'doubleDoubles',
  'tripleDoubles',
  'tenReboundGames',
  'tenAssistGames',
  'fiveBlockGames',
  'fourStealGames',
  'sixThreeGames',
  'playedHurt',
  'filmBlocks',
  'studyBlocks',
  'restBlocks',
  'bondingBlocks',
  'mediaBlocks',
  'technicals',
  'wins',
  'tournamentWins',
  'internationalCaps',
  'signatureSuccesses',
] as const;
export type Feat = (typeof FEATS)[number];

export interface TraitEffects {
  /** Log-odds on every shot. */
  readonly shotMod?: number;
  /** Extra log-odds in clutch time and on late key moments. */
  readonly clutchMod?: number;
  readonly usageMul?: number;
  /** Stamina at tip-off, replacing the default 60. */
  readonly stamina?: number;
  /** Multiplier on all skill growth. */
  readonly growth?: number;
  /** Multipliers on growth of specific skills. */
  readonly growthSkill?: Partial<Record<Skill, number>>;
  /** Added to every hidden ceiling at creation. */
  readonly ceiling?: number;
  /** Added to starting skills at creation. */
  readonly startSkills?: number;
  readonly injuryRisk?: number;
  /** Multiplier on weeks out when injured. */
  readonly recovery?: number;
  /** Multiplier on confidence changes, both ways. */
  readonly confidenceSwing?: number;
  /** Multiplier on study effects. */
  readonly grades?: number;
  /** Multiplier on bonding effects. */
  readonly chemistry?: number;
  /** Multiplier on coach-trust gains. */
  readonly coachTrust?: number;
  /** Multiplier on reputation from media work and good games. */
  readonly reputation?: number;
  /** 0–1: how quickly slumps break. */
  readonly slumpResist?: number;
  /** Chance per game of losing his temper (technical, ejection risk). */
  readonly temper?: number;
  /** Log-odds by key-moment action. */
  readonly momentEdge?: Partial<Record<MomentActionKind, number>>;
}

export interface TraitDef {
  readonly id: string;
  readonly kind: 'gift' | 'flaw' | 'earned';
  readonly effects: TraitEffects;
  /** Earned traits unlock when a feat counter reaches `count`. */
  readonly unlock?: { readonly feat: Feat; readonly count: number };
  /** Earned flaws can also come from consequences; listed here for the timeline. */
  readonly excludes?: readonly string[];
}

// ------------------------------------------------------------------ conditions and effects

export type Stage = 'highSchool' | 'college' | 'prospect';

export interface Conditions {
  readonly stages?: readonly Stage[];
  readonly phases?: readonly CollegePhase[];
  readonly weeks?: readonly [number, number];
  /** Seasons already completed in college (0 for a freshman). */
  readonly collegeSeasons?: readonly [number, number];
  readonly flagsAll?: readonly string[];
  readonly flagsNone?: readonly string[];
  /** A flag set within the last N weeks. */
  readonly flagRecent?: { readonly id: string; readonly withinWeeks: number };
  readonly traitsAny?: readonly string[];
  readonly traitsNone?: readonly string[];
  readonly status?: Partial<Record<StatusKey, readonly [number, number]>>;
  readonly relations?: Partial<Record<Relation, readonly [number, number]>>;
  readonly skillsMin?: Partial<Record<Skill, number>>;
  readonly roles?: readonly Role[];
  readonly styles?: readonly PlayStyle[];
  readonly positions?: readonly Position[];
  readonly lastGame?: 'win' | 'loss' | 'bigGame' | 'badGame' | 'none';
  readonly form?: 'hot' | 'slump';
  readonly injured?: boolean;
  readonly hasAgent?: boolean;
  readonly declared?: boolean;
  /** Projected draft range: best and worst pick, 61 meaning undrafted. */
  readonly projectedPick?: readonly [number, number];
  readonly nationStrength?: readonly [number, number];
}

export type Effect =
  | { readonly kind: 'status'; readonly key: StatusKey; readonly delta: number }
  | { readonly kind: 'skill'; readonly skill: Skill; readonly delta: number }
  | { readonly kind: 'ceiling'; readonly delta: number }
  | { readonly kind: 'relation'; readonly who: Relation; readonly delta: number }
  | { readonly kind: 'flag'; readonly id: string; readonly set: boolean }
  | {
      readonly kind: 'later';
      readonly consequence: string;
      readonly inWeeks: readonly [number, number];
      readonly chance: number;
    }
  | { readonly kind: 'trait'; readonly id: string; readonly add: boolean }
  | { readonly kind: 'injury'; readonly injury: string; readonly weeks: readonly [number, number] }
  | { readonly kind: 'suspension'; readonly games: number }
  | { readonly kind: 'feat'; readonly feat: Feat; readonly delta: number }
  | { readonly kind: 'social'; readonly template: string }
  | { readonly kind: 'draftStock'; readonly delta: number }
  | {
      readonly kind: 'chance';
      readonly p: number;
      readonly then: readonly Effect[];
      readonly otherwise?: readonly Effect[];
    }
  /** Raises or lowers the odds of a stat-based check, such as a skill or status. */
  | {
      readonly kind: 'check';
      readonly skill?: Skill;
      readonly status?: StatusKey;
      /** Value at which success is 50/50. */
      readonly against: number;
      readonly then: readonly Effect[];
      readonly otherwise: readonly Effect[];
    };

// ------------------------------------------------------------------ events and consequences

export type EventCategory =
  | 'coach'
  | 'team'
  | 'academics'
  | 'media'
  | 'social'
  | 'family'
  | 'money'
  | 'health'
  | 'rival'
  | 'national'
  | 'draft'
  | 'agent'
  | 'campus'
  | 'recruiting';

export type CastRole =
  'coach' | 'teammate' | 'rival' | 'journalist' | 'agent' | 'opponent' | 'starTeammate';

export interface EventChoiceDef {
  readonly id: string;
  /** The choice exists only if these hold (often because of earlier choices). */
  readonly requires?: Conditions;
  readonly effects: readonly Effect[];
}

export interface EventDef {
  readonly id: string;
  readonly category: EventCategory;
  readonly when: Conditions;
  readonly weight: number;
  readonly once?: boolean;
  readonly cooldownWeeks?: number;
  /** People the text refers to; filled from the career's context. */
  readonly cast?: readonly CastRole[];
  /** High-priority events interrupt simulate-ahead. Default true. */
  readonly important?: boolean;
  readonly choices: readonly EventChoiceDef[];
}

export interface ConsequenceDef {
  readonly id: string;
  /** It only fires if these still hold when it comes due. */
  readonly when?: Conditions;
  readonly effects: readonly Effect[];
  /** A follow-up event card shown when it fires. */
  readonly event?: string;
}

// ------------------------------------------------------------------ key moments

export type MomentActionKind = 'shot' | 'pass' | 'defend' | 'pain';

export type MomentAction =
  | {
      readonly kind: 'shot';
      readonly shotType: ShotType;
      /** Log-odds relative to a normal attempt of that type (negative = harder). */
      readonly difficulty: number;
      /** Chance of drawing a foul, before ratings. */
      readonly foulChance: number;
      readonly turnoverChance: number;
    }
  | {
      readonly kind: 'pass';
      readonly shotType: ShotType;
      /** Log-odds bonus for the teammate's look. */
      readonly openness: number;
      readonly turnoverChance: number;
    }
  | {
      readonly kind: 'defend';
      /** Gamble: more steals and blocks, more open shots when it fails. */
      readonly gamble: number;
      readonly foulChance: number;
    }
  | { readonly kind: 'pain'; readonly playThrough: boolean };

export interface MomentTrigger {
  readonly side: 'offense' | 'defense' | 'any';
  readonly lastPeriodOnly?: boolean;
  /** Seconds left in the period, at most. */
  readonly clockUnder?: number;
  /** Seconds left in the period, at least. */
  readonly clockOver?: number;
  /** Score margin from the user's side, inclusive. */
  readonly margin?: readonly [number, number];
  readonly transition?: boolean;
  readonly contexts?: readonly GameContext[];
  readonly roles?: readonly Role[];
  readonly styles?: readonly PlayStyle[];
  readonly traitsAny?: readonly string[];
  /** Only when the player is carrying a knock or injury. */
  readonly hurt?: boolean;
}

export type GameContext =
  'regular' | 'conference' | 'tournament' | 'international' | 'rivalry' | 'showcase' | 'exhibition';

export interface MomentOptionDef {
  readonly id: string;
  readonly requires?: Conditions;
  readonly action: MomentAction;
  /** Play template for the clip. */
  readonly clip: string;
}

export interface MomentDef {
  readonly id: string;
  readonly trigger: MomentTrigger;
  readonly weight: number;
  readonly options: readonly MomentOptionDef[];
}

// ------------------------------------------------------------------ social posts

export type SocialTrigger =
  | 'bigGame'
  | 'badGame'
  | 'gameWinner'
  | 'clutchMiss'
  | 'win'
  | 'loss'
  | 'upset'
  | 'injury'
  | 'commit'
  | 'callUp'
  | 'draftRise'
  | 'draftFall'
  | 'rivalBigGame'
  | 'quietWeek'
  | 'event'
  | 'declare'
  | 'drafted'
  | 'undrafted';

export type SocialAuthor =
  | 'fan'
  | 'hater'
  | 'analyst'
  | 'teammate'
  | 'rival'
  | 'journalist'
  | 'hometown'
  | 'brand'
  | 'parody';

export interface SocialTemplateDef {
  readonly id: string;
  readonly trigger: SocialTrigger;
  readonly author: SocialAuthor;
  readonly weight: number;
  readonly when?: Conditions;
  /** Reply options the player gets, by tone. Empty means no reply possible. */
  readonly replies: readonly ('gracious' | 'funny' | 'sharp')[];
}
