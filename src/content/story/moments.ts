import type { MomentDef } from '@/engine/content/story-types';

/**
 * Key-moment situations. Difficulty and openness are log-odds against an ordinary attempt of
 * that shot type; the player's ratings, the defence and his traits do the rest.
 */
export const moments: readonly MomentDef[] = [
  {
    id: 'last_shot_tied',
    trigger: { side: 'offense', lastPeriodOnly: true, clockUnder: 24, margin: [-2, 0] },
    weight: 6,
    options: [
      {
        id: 'pull_up',
        clip: 'iso_pullup',
        action: {
          kind: 'shot',
          shotType: 'mid',
          difficulty: -0.25,
          foulChance: 0.05,
          turnoverChance: 0.04,
        },
      },
      {
        id: 'drive',
        clip: 'drive_layup',
        action: {
          kind: 'shot',
          shotType: 'rim',
          difficulty: -0.2,
          foulChance: 0.18,
          turnoverChance: 0.08,
        },
      },
      {
        id: 'kick_out',
        clip: 'drive_and_kick',
        action: { kind: 'pass', shotType: 'three', openness: 0.25, turnoverChance: 0.06 },
      },
      {
        id: 'step_back',
        clip: 'step_back_three',
        requires: { skillsMin: { shooting: 58 } },
        action: {
          kind: 'shot',
          shotType: 'three',
          difficulty: -0.4,
          foulChance: 0.03,
          turnoverChance: 0.03,
        },
      },
    ],
  },
  {
    id: 'down_three_final',
    trigger: { side: 'offense', lastPeriodOnly: true, clockUnder: 20, margin: [-3, -3] },
    weight: 6,
    options: [
      {
        id: 'contested_three',
        clip: 'catch_shoot_three',
        action: {
          kind: 'shot',
          shotType: 'three',
          difficulty: -0.45,
          foulChance: 0.04,
          turnoverChance: 0.03,
        },
      },
      {
        id: 'pump_fake',
        clip: 'step_back_three',
        action: {
          kind: 'shot',
          shotType: 'three',
          difficulty: -0.65,
          foulChance: 0.3,
          turnoverChance: 0.05,
        },
      },
      {
        id: 'find_shooter',
        clip: 'drive_and_kick',
        action: { kind: 'pass', shotType: 'three', openness: 0.05, turnoverChance: 0.07 },
      },
    ],
  },
  {
    id: 'protect_the_lead',
    trigger: { side: 'defense', lastPeriodOnly: true, clockUnder: 30, margin: [1, 3] },
    weight: 5,
    options: [
      { id: 'stay_home', clip: 'block', action: { kind: 'defend', gamble: 0, foulChance: 0.03 } },
      {
        id: 'jump_the_pass',
        clip: 'steal_runout',
        action: { kind: 'defend', gamble: 0.7, foulChance: 0.1 },
      },
      { id: 'body_up', clip: 'charge', action: { kind: 'defend', gamble: 0.3, foulChance: 0.15 } },
    ],
  },
  {
    id: 'two_on_one',
    trigger: { side: 'offense', transition: true },
    weight: 4,
    options: [
      {
        id: 'finish_it',
        clip: 'fast_break',
        action: {
          kind: 'shot',
          shotType: 'rim',
          difficulty: 0.35,
          foulChance: 0.2,
          turnoverChance: 0.04,
        },
      },
      {
        id: 'dish_it',
        clip: 'alley_oop',
        action: { kind: 'pass', shotType: 'rim', openness: 0.6, turnoverChance: 0.08 },
      },
      {
        id: 'transition_three',
        clip: 'catch_shoot_three',
        action: {
          kind: 'shot',
          shotType: 'three',
          difficulty: -0.05,
          foulChance: 0.01,
          turnoverChance: 0.01,
        },
      },
    ],
  },
  {
    id: 'double_team',
    trigger: { side: 'offense', clockOver: 60, roles: ['starter', 'star'] },
    weight: 3,
    options: [
      {
        id: 'split_it',
        clip: 'drive_layup',
        action: {
          kind: 'shot',
          shotType: 'rim',
          difficulty: -0.35,
          foulChance: 0.15,
          turnoverChance: 0.16,
        },
      },
      {
        id: 'swing_it',
        clip: 'drive_and_kick',
        action: { kind: 'pass', shotType: 'three', openness: 0.3, turnoverChance: 0.05 },
      },
      {
        id: 'reset',
        clip: 'pick_and_roll_pullup',
        action: { kind: 'pass', shotType: 'mid', openness: 0, turnoverChance: 0.02 },
      },
    ],
  },
  {
    id: 'pick_and_roll_read',
    trigger: { side: 'offense', styles: ['playmaker', 'shooter', 'slasher'] },
    weight: 3,
    options: [
      {
        id: 'pull_up',
        clip: 'pick_and_roll_pullup',
        action: {
          kind: 'shot',
          shotType: 'mid',
          difficulty: 0,
          foulChance: 0.04,
          turnoverChance: 0.03,
        },
      },
      {
        id: 'hit_the_roller',
        clip: 'pick_and_roll_roll',
        action: { kind: 'pass', shotType: 'rim', openness: 0.35, turnoverChance: 0.07 },
      },
      {
        id: 'reject_screen',
        clip: 'drive_layup',
        action: {
          kind: 'shot',
          shotType: 'rim',
          difficulty: -0.2,
          foulChance: 0.14,
          turnoverChance: 0.06,
        },
      },
    ],
  },
  {
    id: 'post_mismatch',
    trigger: { side: 'offense', styles: ['bigMan', 'defender', 'slasher'] },
    weight: 3,
    options: [
      {
        id: 'drop_step',
        clip: 'post_up',
        action: {
          kind: 'shot',
          shotType: 'post',
          difficulty: 0.15,
          foulChance: 0.16,
          turnoverChance: 0.06,
        },
      },
      {
        id: 'turnaround',
        clip: 'post_up',
        action: {
          kind: 'shot',
          shotType: 'mid',
          difficulty: -0.15,
          foulChance: 0.05,
          turnoverChance: 0.03,
        },
      },
      {
        id: 'kick_it_back',
        clip: 'drive_and_kick',
        action: { kind: 'pass', shotType: 'three', openness: 0.2, turnoverChance: 0.04 },
      },
    ],
  },
  {
    id: 'rim_protection',
    trigger: { side: 'defense', styles: ['bigMan', 'defender'] },
    weight: 3,
    options: [
      { id: 'wall_up', clip: 'block', action: { kind: 'defend', gamble: 0.1, foulChance: 0.05 } },
      {
        id: 'go_for_the_block',
        clip: 'block',
        action: { kind: 'defend', gamble: 0.6, foulChance: 0.18 },
      },
      {
        id: 'take_the_charge',
        clip: 'charge',
        action: { kind: 'defend', gamble: 0.45, foulChance: 0.12 },
      },
    ],
  },
  {
    id: 'took_a_knock',
    trigger: { side: 'any', hurt: true },
    weight: 50,
    options: [
      { id: 'play_through', clip: 'checkup', action: { kind: 'pain', playThrough: true } },
      { id: 'sit_down', clip: 'checkup', action: { kind: 'pain', playThrough: false } },
    ],
  },
  {
    id: 'bench_spark',
    trigger: { side: 'offense', roles: ['bench', 'rotation'] },
    weight: 4,
    options: [
      {
        id: 'let_it_fly',
        clip: 'catch_shoot_three',
        action: {
          kind: 'shot',
          shotType: 'three',
          difficulty: 0.15,
          foulChance: 0.01,
          turnoverChance: 0.01,
        },
      },
      {
        id: 'attack_closeout',
        clip: 'drive_layup',
        action: {
          kind: 'shot',
          shotType: 'rim',
          difficulty: 0,
          foulChance: 0.15,
          turnoverChance: 0.07,
        },
      },
      {
        id: 'extra_pass',
        clip: 'drive_and_kick',
        action: { kind: 'pass', shotType: 'three', openness: 0.15, turnoverChance: 0.03 },
      },
    ],
  },
  {
    id: 'showcase_spotlight',
    trigger: { side: 'offense', contexts: ['showcase'] },
    weight: 20,
    options: [
      {
        id: 'go_to_move',
        clip: 'iso_pullup',
        action: {
          kind: 'shot',
          shotType: 'mid',
          difficulty: -0.1,
          foulChance: 0.05,
          turnoverChance: 0.04,
        },
      },
      {
        id: 'off_the_glass',
        clip: 'alley_oop',
        action: {
          kind: 'shot',
          shotType: 'rim',
          difficulty: -0.45,
          foulChance: 0.05,
          turnoverChance: 0.1,
        },
      },
      {
        id: 'right_play',
        clip: 'drive_and_kick',
        action: { kind: 'pass', shotType: 'rim', openness: 0.4, turnoverChance: 0.04 },
      },
    ],
  },
  {
    id: 'stop_their_star',
    trigger: {
      side: 'defense',
      lastPeriodOnly: true,
      clockUnder: 150,
      margin: [-5, 5],
      contexts: ['tournament', 'rivalry', 'international'],
    },
    weight: 5,
    options: [
      {
        id: 'deny_the_catch',
        clip: 'steal_runout',
        action: { kind: 'defend', gamble: 0.35, foulChance: 0.06 },
      },
      {
        id: 'play_physical',
        clip: 'charge',
        action: { kind: 'defend', gamble: 0.1, foulChance: 0.2 },
      },
      {
        id: 'stay_disciplined',
        clip: 'block',
        action: { kind: 'defend', gamble: 0, foulChance: 0.04 },
      },
    ],
  },
];
