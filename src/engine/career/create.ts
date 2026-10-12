import { WEEK } from '../core/calendar';
import { asPersonId, nextId } from '../core/ids';
import { clamp } from '../core/math';
import { createRng } from '../core/rng';
import { foldName, type ContentIndex } from '../content/registry';
import { FEATS, RELATIONS, type Feat, type Relation } from '../content/story-types';
import { prospectScore } from '../college/recruiting';
import type { Career, WeekPlan } from '../model/career';
import type { Player, Portrait } from '../model/person';
import type { PlayStyle, Position } from '../model/skills';
import { pickWeight, pickWingspan, rollSkills } from '../player/archetypes';
import { rollCeilings } from '../player/potential';
import { createWorld } from '../world/create';
import { generateJournalist } from '../world/staff';
import { createShowcase } from './recruiting';
import { SAVE_FORMAT, msg, pushFeed, pushTimeline, cause, type GameState } from './state';

export interface CreationInput {
  readonly given: string;
  readonly family: string;
  readonly nation: string;
  readonly hometown: string;
  readonly heightCm: number;
  readonly position: Position;
  readonly style: PlayStyle;
  readonly jersey: number;
  readonly portrait: Portrait;
  readonly gift: string;
  readonly flaw: string;
  readonly seed: string;
  readonly startYear: number;
}

export const DEFAULT_PLAN: WeekPlan = {
  train: { shooting: 2, handling: 1, defence: 1, athleticism: 1 },
  rest: 2,
  film: 1,
  bonding: 1,
  study: 1,
  media: 0,
};

const OUTLETS = [
  'The Baseline Ledger',
  'Courtside Courier',
  'The Hardwood Review',
  'Press Row Weekly',
  'The Shot Clock',
];

/** A new career: a fresh world, the user's player in this spring's high-school class, his rival and his beat writer. */
/** Points to spend before the first game, so the upgrade screen means something from day one. */
export const STARTING_SKILL_POINTS = 9;

export function createCareer(index: ContentIndex, input: CreationInput): GameState {
  const nation = index.nation.get(input.nation);
  const gift = index.trait.get(input.gift);
  const flaw = index.trait.get(input.flaw);
  if (!nation) throw new Error(`unknown nation ${input.nation}`);
  if (gift?.kind !== 'gift' || flaw?.kind !== 'flaw')
    throw new Error('creation needs one gift and one flaw');

  const world = createWorld(index, input.seed, {
    year: input.startYear,
    week: WEEK.recruitingStart,
  });
  const rng = createRng(input.seed, 'user');
  const start = (gift.effects.startSkills ?? 0) + (flaw.effects.startSkills ?? 0);
  const level = 45 + start + rng.normal(0, 1);
  const skills = rollSkills(rng, level, input.style, 4);
  // Hidden potential: wide enough that some careers can reach the top of a draft and some
  // cannot, but not so wide that the roll decides more than the way he is played.
  const gap = clamp(
    rng.normal(22.5, 4) + (gift.effects.ceiling ?? 0) + (flaw.effects.ceiling ?? 0),
    15,
    38,
  );
  const user: Player = {
    id: asPersonId(nextId(world.counters, 'person', 'p')),
    kind: 'player',
    given: input.given,
    family: input.family,
    nation: nation.code,
    hometown: input.hometown,
    birthYear: input.startYear - 18,
    portrait: input.portrait,
    heightCm: input.heightCm,
    wingspanCm: pickWingspan(rng, input.heightCm),
    weightKg: pickWeight(rng, input.heightCm, input.position),
    position: input.position,
    style: input.style,
    skills,
    ceiling: rollCeilings(rng, skills, input.style, level + gap),
    growthRate: 1.08,
    traits: [gift.id, flaw.id],
    health: 100,
    energy: 90,
    confidence: 55,
    injury: null,
    chronic: [],
    jersey: input.jersey,
    affiliation: { kind: 'highSchool', graduationYear: input.startYear },
    stints: [],
    lines: [],
    draft: null,
    recruitRank: null,
    isUser: true,
  };
  world.people[user.id] = user;

  // Place him in the class ranking.
  const classPlayers = world.recruitingClass
    .map((id) => world.people[id])
    .filter((p): p is Player => p?.kind === 'player');
  classPlayers.push(user);
  classPlayers.sort((a, b) => prospectScore(b) - prospectScore(a));
  world.recruitingClass = classPlayers.map((p) => p.id);
  classPlayers.forEach((p, i) => (p.recruitRank = i + 1));

  // The rival: same position, similar promise, from the same class.
  const myScore = prospectScore(user);
  const rival = [...classPlayers]
    .filter((p) => p.id !== user.id)
    .sort((a, b) => {
      const da = Math.abs(prospectScore(a) - myScore - 1) + (a.position === user.position ? 0 : 4);
      const db = Math.abs(prospectScore(b) - myScore - 1) + (b.position === user.position ? 0 : 4);
      return da - db;
    })[0];

  const usa = index.nation.get('USA') ?? nation;
  const taken = new Set(Object.values(world.people).map((p) => foldName(`${p.given} ${p.family}`)));
  const journalist = generateJournalist({ rng, index, world, taken }, usa, rng.pick(OUTLETS));
  world.people[journalist.id] = journalist;

  createShowcase(world, user);

  const relations = Object.fromEntries(RELATIONS.map((r) => [r, 50])) as Record<Relation, number>;
  const feats = Object.fromEntries(FEATS.map((f) => [f, 0])) as Record<Feat, number>;
  const career: Career = {
    playerId: user.id,
    stage: 'highSchool',
    role: 'starter',
    stock: 0,
    plan: DEFAULT_PLAN,
    coachTrust: 50,
    chemistry: 55,
    reputation: 18,
    money: 400,
    gpa: 2.9,
    relations,
    flags: {},
    scheduled: [],
    timeline: [],
    feed: [],
    pending: [],
    cursor: {
      stage: 'idle',
      gameIds: [],
      gameIndex: 0,
      live: null,
      leagueDone: false,
      eventsDone: false,
    },
    tendencies: {},
    rivalId: rival?.id ?? null,
    journalistId: journalist.id,
    agentId: null,
    agentOffers: [],
    deals: [],
    feats,
    recent: [],
    form: null,
    draft: {
      declared: false,
      testingWaters: false,
      projected: [61, 61],
      history: [],
      workouts: [],
      interest: {},
    },
    offers: [],
    committedTo: null,
    suspendedGames: 0,
    ineligible: false,
    eventLog: {},
    signature: null,
    moveUses: {},
    callUps: {},
    godMode: {
      unlocked: false,
      forceNextMoment: null,
      forceNextGame: null,
      revealHidden: false,
      draftTeam: null,
      forceCallUp: false,
    },
    ending: null,
    skillPoints: STARTING_SKILL_POINTS,
    skillPointsEarned: STARTING_SKILL_POINTS,
    approach: 'team',
    awardsSeen: {},
  };
  const state: GameState = {
    format: SAVE_FORMAT,
    meta: {
      saveId: input.seed,
      createdAt: world.date,
      contentVersion: index.content.version,
      seed: input.seed,
      integrity: { godMode: false, log: [] },
    },
    world,
    career,
  };
  pushTimeline(
    state,
    msg('timeline.created', { player: { person: user.id } }),
    cause(state, 'creation', 'player'),
    true,
  );
  pushFeed(
    state,
    'news',
    msg('feed.welcome', { rank: user.recruitRank ?? 0, rival: rival ? { person: rival.id } : '' }),
  );
  return state;
}
