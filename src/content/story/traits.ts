import type { TraitDef } from '@/engine/content/story-types';

export const traits: readonly TraitDef[] = [
  // Gifts: one is chosen at creation.
  {
    id: 'clutch',
    kind: 'gift',
    effects: { clutchMod: 0.25, momentEdge: { shot: 0.1 } },
    unlock: { feat: 'gameWinners', count: 3 },
  },
  { id: 'gym_rat', kind: 'gift', effects: { growth: 1.12, stamina: 70 } },
  {
    id: 'floor_general',
    kind: 'gift',
    effects: {
      growthSkill: { playmaking: 1.25, gameSense: 1.15 },
      momentEdge: { pass: 0.15 },
      coachTrust: 1.15,
    },
  },
  {
    id: 'quick_learner',
    kind: 'gift',
    effects: { growth: 1.06, growthSkill: { gameSense: 1.35 }, slumpResist: 0.45 },
  },
  { id: 'iron_man', kind: 'gift', effects: { injuryRisk: 0.6, recovery: 0.75, stamina: 75 } },
  {
    id: 'bouncy',
    kind: 'gift',
    effects: { growthSkill: { athleticism: 1.3 }, ceiling: 1, momentEdge: { defend: 0.1 } },
  },
  { id: 'silky_touch', kind: 'gift', effects: { shotMod: 0.06, growthSkill: { shooting: 1.2 } } },
  {
    id: 'natural_leader',
    kind: 'gift',
    effects: { chemistry: 1.3, coachTrust: 1.2, reputation: 1.1 },
  },

  // Flaws: one is chosen at creation; some can also be earned the hard way.
  { id: 'injury_prone', kind: 'flaw', effects: { injuryRisk: 1.7, recovery: 1.25 } },
  {
    id: 'hothead',
    kind: 'flaw',
    effects: {
      temper: 0.04,
      coachTrust: 0.85,
      confidenceSwing: 1.2,
      momentEdge: { defend: -0.05 },
    },
  },
  { id: 'streaky', kind: 'flaw', effects: { confidenceSwing: 1.5, slumpResist: 0.1 } },
  { id: 'late_bloomer', kind: 'flaw', effects: { startSkills: -4, ceiling: 4, growth: 1.05 } },
  { id: 'poor_student', kind: 'flaw', effects: { grades: 0.6 } },
  {
    id: 'soft_hands',
    kind: 'flaw',
    effects: { shotMod: -0.04, growthSkill: { handling: 0.85 }, momentEdge: { pass: -0.12 } },
  },
  { id: 'loner', kind: 'flaw', effects: { chemistry: 0.6, reputation: 0.9 } },
  { id: 'spotlight_nerves', kind: 'flaw', effects: { clutchMod: -0.25, confidenceSwing: 1.15 } },
  { id: 'brittle', kind: 'flaw', effects: { injuryRisk: 1.35, recovery: 1.15 } },
  {
    id: 'yips',
    kind: 'flaw',
    effects: { clutchMod: -0.15 },
    unlock: { feat: 'clutchMisses', count: 4 },
    excludes: ['clutch'],
  },

  // Earned: unlocked by what he does.
  {
    id: 'glass_cleaner',
    kind: 'earned',
    effects: { growthSkill: { rebounding: 1.15 }, momentEdge: { defend: 0.05 } },
    unlock: { feat: 'tenReboundGames', count: 10 },
  },
  {
    id: 'table_setter',
    kind: 'earned',
    effects: { momentEdge: { pass: 0.15 }, coachTrust: 1.05 },
    unlock: { feat: 'tenAssistGames', count: 5 },
  },
  {
    id: 'bucket_getter',
    kind: 'earned',
    effects: { usageMul: 1.08, shotMod: 0.03 },
    unlock: { feat: 'thirtyPointGames', count: 3 },
  },
  {
    id: 'rim_protector',
    kind: 'earned',
    effects: { momentEdge: { defend: 0.15 } },
    unlock: { feat: 'fiveBlockGames', count: 3 },
  },
  {
    id: 'pickpocket',
    kind: 'earned',
    effects: { momentEdge: { defend: 0.1 } },
    unlock: { feat: 'fourStealGames', count: 4 },
  },
  {
    id: 'sniper',
    kind: 'earned',
    effects: { shotMod: 0.04 },
    unlock: { feat: 'sixThreeGames', count: 3 },
  },
  {
    id: 'film_junkie',
    kind: 'earned',
    effects: { growthSkill: { gameSense: 1.2 }, slumpResist: 0.5 },
    unlock: { feat: 'filmBlocks', count: 70 },
  },
  {
    id: 'tough_as_nails',
    kind: 'earned',
    effects: { injuryRisk: 1.1, confidenceSwing: 0.85, clutchMod: 0.05 },
    unlock: { feat: 'playedHurt', count: 3 },
  },
  {
    id: 'student_athlete',
    kind: 'earned',
    effects: { grades: 1.3, coachTrust: 1.05 },
    unlock: { feat: 'studyBlocks', count: 110 },
  },
  {
    id: 'glue_guy',
    kind: 'earned',
    effects: { chemistry: 1.3 },
    unlock: { feat: 'bondingBlocks', count: 70 },
  },
  {
    id: 'media_darling',
    kind: 'earned',
    effects: { reputation: 1.3, coachTrust: 0.95 },
    unlock: { feat: 'mediaBlocks', count: 60 },
  },
  {
    id: 'triple_threat',
    kind: 'earned',
    effects: { usageMul: 1.05, momentEdge: { pass: 0.05 } },
    unlock: { feat: 'tripleDoubles', count: 1 },
  },
  {
    id: 'big_game_hunter',
    kind: 'earned',
    effects: { clutchMod: 0.1 },
    unlock: { feat: 'tournamentWins', count: 6 },
  },
  {
    id: 'flag_bearer',
    kind: 'earned',
    effects: { reputation: 1.1, confidenceSwing: 0.9 },
    unlock: { feat: 'internationalCaps', count: 12 },
  },
];
