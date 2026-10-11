/**
 * Zod schemas for every content kind. The app validates the whole registry at startup and a
 * test does the same in CI, so a typo in a data file fails loudly instead of misbehaving.
 */

import { z } from 'zod';

import { FEATS, RELATIONS, STATUS_KEYS } from '@/engine/content/story-types';
import { PLAY_STYLES, POSITIONS, SKILLS } from '@/engine/model/skills';

const id = z.string().regex(/^[a-z][a-zA-Z0-9_]*$/, 'ids are camelCase or snake_case ASCII');
const hex = z.string().regex(/^#[0-9A-F]{6}$/i, 'colours are #RRGGBB');
const colours = z.object({ primary: hex, secondary: hex });
const range = z
  .tuple([z.number(), z.number()])
  .refine(([a, b]) => a <= b, 'range start must not exceed its end');
const name = z
  .string()
  .min(1)
  .max(40)
  .refine((s) => s.trim() === s, 'no surrounding spaces');

export const namingCultureSchema = z.object({
  id,
  given: z.array(name).min(60),
  family: z.array(name).min(100),
});

export const nationSchema = z.object({
  code: z.string().regex(/^[A-Z]{3}$/),
  continent: z.enum(['americas', 'europe', 'asiaPacific', 'africa']),
  strength: z.number().min(0).max(100),
  talentShare: z.number().positive(),
  naming: z.array(z.object({ id, weight: z.number().positive() })).min(1),
  cities: z.array(name).min(8),
  colours,
  clubs: z.array(name),
});

export const conferenceSchema = z.object({
  id,
  name,
  shortName: name,
  tier: z.enum(['major', 'mid', 'low']),
});

export const collegeSchema = z.object({
  id,
  name,
  nickname: name,
  abbr: z.string().regex(/^[A-Z]{2,4}$/),
  city: name,
  region: z.string().regex(/^[A-Z]{2}$/),
  conferenceId: id,
  prestige: z.number().int().min(1).max(100),
  academics: z.number().int().min(1).max(100),
  colours,
});

export const proTeamSchema = z.object({
  id,
  city: name,
  nickname: name,
  abbr: z.string().regex(/^[A-Z]{3}$/),
  conference: z.enum(['east', 'west']),
  division: name,
  market: z.number().int().min(1).max(100),
  colours,
  emblem: z.string(),
});

const skill = z.enum(SKILLS);
const statusKey = z.enum(STATUS_KEYS);
const relation = z.enum(RELATIONS);
const feat = z.enum(FEATS);

export const conditionsSchema = z
  .object({
    stages: z.array(z.enum(['highSchool', 'college', 'prospect'])),
    phases: z.array(
      z.enum([
        'summer',
        'preseason',
        'nonConference',
        'conference',
        'conferenceTournament',
        'nationalTournament',
        'spring',
        'draftProcess',
      ]),
    ),
    weeks: range,
    collegeSeasons: range,
    flagsAll: z.array(id),
    flagsNone: z.array(id),
    flagRecent: z.object({ id, withinWeeks: z.number().int().positive() }),
    traitsAny: z.array(id),
    traitsNone: z.array(id),
    status: z.partialRecord(statusKey, range),
    relations: z.partialRecord(relation, range),
    skillsMin: z.partialRecord(skill, z.number()),
    roles: z.array(z.enum(['bench', 'rotation', 'starter', 'star'])),
    styles: z.array(z.enum(PLAY_STYLES)),
    positions: z.array(z.enum(POSITIONS)),
    lastGame: z.enum(['win', 'loss', 'bigGame', 'badGame', 'none']),
    form: z.enum(['hot', 'slump']),
    injured: z.boolean(),
    hasAgent: z.boolean(),
    declared: z.boolean(),
    projectedPick: range,
    nationStrength: range,
  })
  .partial()
  .strict();

type EffectInput =
  | z.input<typeof effectBase>
  | { kind: 'chance'; p: number; then: EffectInput[]; otherwise?: EffectInput[] | undefined }
  | {
      kind: 'check';
      skill?: string | undefined;
      status?: string | undefined;
      against: number;
      then: EffectInput[];
      otherwise: EffectInput[];
    };

const effectBase = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('status'), key: statusKey, delta: z.number() }).strict(),
  z.object({ kind: z.literal('skill'), skill, delta: z.number() }).strict(),
  z.object({ kind: z.literal('ceiling'), delta: z.number() }).strict(),
  z.object({ kind: z.literal('relation'), who: relation, delta: z.number() }).strict(),
  z.object({ kind: z.literal('flag'), id, set: z.boolean() }).strict(),
  z
    .object({
      kind: z.literal('later'),
      consequence: id,
      inWeeks: range,
      chance: z.number().min(0).max(1),
    })
    .strict(),
  z.object({ kind: z.literal('trait'), id, add: z.boolean() }).strict(),
  z.object({ kind: z.literal('injury'), injury: id, weeks: range }).strict(),
  z.object({ kind: z.literal('suspension'), games: z.number().int().positive() }).strict(),
  z.object({ kind: z.literal('feat'), feat, delta: z.number().int() }).strict(),
  z.object({ kind: z.literal('social'), template: id }).strict(),
  z.object({ kind: z.literal('draftStock'), delta: z.number() }).strict(),
]);

export const effectSchema: z.ZodType<EffectInput> = z.lazy(() =>
  z.union([
    effectBase,
    z
      .object({
        kind: z.literal('chance'),
        p: z.number().min(0).max(1),
        then: z.array(effectSchema),
        otherwise: z.array(effectSchema).optional(),
      })
      .strict(),
    z
      .object({
        kind: z.literal('check'),
        skill: skill.optional(),
        status: statusKey.optional(),
        against: z.number(),
        then: z.array(effectSchema),
        otherwise: z.array(effectSchema),
      })
      .strict()
      .refine(
        (c) => (c.skill === undefined) !== (c.status === undefined),
        'a check needs exactly one of skill or status',
      ),
  ]),
);

export const traitSchema = z
  .object({
    id,
    kind: z.enum(['gift', 'flaw', 'earned']),
    effects: z
      .object({
        shotMod: z.number(),
        clutchMod: z.number(),
        usageMul: z.number().positive(),
        stamina: z.number().min(0).max(100),
        growth: z.number().positive(),
        growthSkill: z.partialRecord(skill, z.number().positive()),
        ceiling: z.number(),
        startSkills: z.number(),
        injuryRisk: z.number().positive(),
        recovery: z.number().positive(),
        confidenceSwing: z.number().positive(),
        grades: z.number().positive(),
        chemistry: z.number().positive(),
        coachTrust: z.number().positive(),
        reputation: z.number().positive(),
        slumpResist: z.number().min(0).max(1),
        temper: z.number().min(0).max(1),
        momentEdge: z.partialRecord(z.enum(['shot', 'pass', 'defend', 'pain']), z.number()),
      })
      .partial()
      .strict(),
    unlock: z.object({ feat, count: z.number().int().positive() }).optional(),
    excludes: z.array(id).optional(),
  })
  .strict()
  .refine(
    (t) => t.kind !== 'earned' || t.unlock !== undefined,
    'earned traits need an unlock rule',
  );

export const eventSchema = z
  .object({
    id,
    category: z.enum([
      'coach',
      'team',
      'academics',
      'media',
      'social',
      'family',
      'money',
      'health',
      'rival',
      'national',
      'draft',
      'agent',
      'campus',
      'recruiting',
    ]),
    when: conditionsSchema,
    weight: z.number().positive(),
    once: z.boolean().optional(),
    cooldownWeeks: z.number().int().positive().optional(),
    cast: z
      .array(
        z.enum(['coach', 'teammate', 'rival', 'journalist', 'agent', 'opponent', 'starTeammate']),
      )
      .optional(),
    important: z.boolean().optional(),
    choices: z
      .array(
        z
          .object({ id, requires: conditionsSchema.optional(), effects: z.array(effectSchema) })
          .strict(),
      )
      .min(2)
      .max(4),
  })
  .strict();

export const consequenceSchema = z
  .object({
    id,
    when: conditionsSchema.optional(),
    effects: z.array(effectSchema),
    event: id.optional(),
  })
  .strict();

const shotType = z.enum(['rim', 'post', 'mid', 'three']);

export const momentSchema = z
  .object({
    id,
    trigger: z
      .object({
        side: z.enum(['offense', 'defense', 'any']),
        lastPeriodOnly: z.boolean(),
        clockUnder: z.number().positive(),
        clockOver: z.number().nonnegative(),
        margin: range,
        transition: z.boolean(),
        contexts: z.array(
          z.enum([
            'regular',
            'conference',
            'tournament',
            'international',
            'rivalry',
            'showcase',
            'exhibition',
          ]),
        ),
        roles: z.array(z.enum(['bench', 'rotation', 'starter', 'star'])),
        styles: z.array(z.enum(PLAY_STYLES)),
        traitsAny: z.array(id),
        hurt: z.boolean(),
      })
      .partial()
      .required({ side: true })
      .strict(),
    weight: z.number().positive(),
    options: z
      .array(
        z
          .object({
            id,
            requires: conditionsSchema.optional(),
            clip: id,
            action: z.discriminatedUnion('kind', [
              z
                .object({
                  kind: z.literal('shot'),
                  shotType,
                  difficulty: z.number(),
                  foulChance: z.number().min(0).max(1),
                  turnoverChance: z.number().min(0).max(1),
                })
                .strict(),
              z
                .object({
                  kind: z.literal('pass'),
                  shotType,
                  openness: z.number(),
                  turnoverChance: z.number().min(0).max(1),
                })
                .strict(),
              z
                .object({
                  kind: z.literal('defend'),
                  gamble: z.number().min(0).max(1),
                  foulChance: z.number().min(0).max(1),
                })
                .strict(),
              z.object({ kind: z.literal('pain'), playThrough: z.boolean() }).strict(),
            ]),
          })
          .strict(),
      )
      .min(2)
      .max(4),
  })
  .strict();

export const socialSchema = z
  .object({
    id,
    trigger: z.enum([
      'bigGame',
      'badGame',
      'gameWinner',
      'clutchMiss',
      'win',
      'loss',
      'upset',
      'injury',
      'commit',
      'callUp',
      'draftRise',
      'draftFall',
      'rivalBigGame',
      'quietWeek',
      'event',
      'declare',
      'drafted',
      'undrafted',
    ]),
    author: z.enum([
      'fan',
      'hater',
      'analyst',
      'teammate',
      'rival',
      'journalist',
      'hometown',
      'brand',
      'parody',
    ]),
    weight: z.number().positive(),
    when: conditionsSchema.optional(),
    replies: z.array(z.enum(['gracious', 'funny', 'sharp'])),
  })
  .strict();
