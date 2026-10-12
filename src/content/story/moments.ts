import type { MomentAction, MomentDef } from '@/engine/content/story-types';
import type { ShotType } from '@/engine/game/types';

const shot = (
  shotType: ShotType,
  difficulty: number,
  foulChance: number,
  turnoverChance: number,
): MomentAction => ({ kind: 'shot', shotType, difficulty, foulChance, turnoverChance });
const pass = (shotType: ShotType, openness: number, turnoverChance: number): MomentAction => ({
  kind: 'pass',
  shotType,
  openness,
  turnoverChance,
});
const defend = (gamble: number, foulChance: number): MomentAction => ({
  kind: 'defend',
  gamble,
  foulChance,
});

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

  // ---------------------------------------------------------------- late offence

  {
    id: 'down_one_final',
    trigger: { side: 'offense', lastPeriodOnly: true, clockUnder: 40, margin: [-1, -1] },
    weight: 6,
    options: [
      { id: 'floater', clip: 'floater', action: shot('mid', 0.05, 0.06, 0.04) },
      { id: 'hunt_the_foul', clip: 'free_throws', action: shot('rim', -0.4, 0.45, 0.07) },
      { id: 'step_back_for_win', clip: 'step_back_three', action: shot('three', -0.5, 0.03, 0.03) },
      {
        id: 'lob_to_the_big',
        clip: 'alley_oop',
        requires: { skillsMin: { playmaking: 55 } },
        action: pass('rim', 0.3, 0.12),
      },
    ],
  },
  {
    id: 'full_court_heave',
    trigger: { side: 'offense', lastPeriodOnly: true, clockUnder: 4, margin: [-3, -1] },
    weight: 8,
    options: [
      { id: 'heave_it', clip: 'last_second_heave', action: shot('three', -2.4, 0.02, 0) },
      { id: 'two_dribbles_and_fire', clip: 'iso_pullup', action: shot('three', -1.5, 0.04, 0.05) },
      { id: 'baseball_pass', clip: 'fast_break', action: pass('rim', -1.2, 0.3) },
    ],
  },
  {
    id: 'end_of_half',
    trigger: { side: 'offense', clockUnder: 6, margin: [-30, 30] },
    weight: 2,
    options: [
      { id: 'beat_the_buzzer', clip: 'last_second_heave', action: shot('three', -1.4, 0.02, 0.01) },
      { id: 'get_to_the_rim', clip: 'drive_layup', action: shot('rim', -0.45, 0.2, 0.06) },
      { id: 'quick_kick', clip: 'drive_and_kick', action: pass('three', -0.3, 0.05) },
    ],
  },
  {
    id: 'tip_in_to_win',
    trigger: {
      side: 'offense',
      lastPeriodOnly: true,
      clockUnder: 30,
      margin: [-2, 0],
      styles: ['bigMan', 'defender', 'slasher'],
    },
    weight: 6,
    options: [
      { id: 'tip_it', clip: 'put_back', action: shot('rim', -0.3, 0.08, 0.02) },
      { id: 'gather_and_go_up', clip: 'put_back', action: shot('rim', -0.15, 0.3, 0.08) },
      { id: 'kick_it_out', clip: 'drive_and_kick', action: pass('three', 0.15, 0.05) },
    ],
  },
  {
    id: 'star_takeover',
    trigger: {
      side: 'offense',
      lastPeriodOnly: true,
      clockUnder: 300,
      margin: [-8, -3],
      roles: ['star', 'starter'],
    },
    weight: 4,
    options: [
      { id: 'go_iso', clip: 'iso_pullup', action: shot('mid', -0.1, 0.06, 0.04) },
      { id: 'get_to_the_line', clip: 'free_throws', action: shot('rim', -0.3, 0.4, 0.07) },
      { id: 'trust_the_team', clip: 'drive_and_kick', action: pass('three', 0.15, 0.04) },
    ],
  },
  {
    id: 'tournament_down_two',
    trigger: {
      side: 'offense',
      lastPeriodOnly: true,
      clockUnder: 60,
      margin: [-2, -1],
      contexts: ['tournament'],
    },
    weight: 8,
    options: [
      { id: 'tie_it', clip: 'drive_layup', action: shot('rim', -0.25, 0.2, 0.06) },
      { id: 'win_it', clip: 'catch_shoot_three', action: shot('three', -0.35, 0.02, 0.03) },
      { id: 'roll_man', clip: 'pick_and_roll_roll', action: pass('rim', 0.3, 0.07) },
    ],
  },
  {
    id: 'international_last_shot',
    trigger: {
      side: 'offense',
      lastPeriodOnly: true,
      clockUnder: 40,
      margin: [-2, 0],
      contexts: ['international'],
    },
    weight: 8,
    options: [
      { id: 'handoff_three', clip: 'catch_shoot_three', action: shot('three', -0.3, 0.02, 0.03) },
      { id: 'pick_and_pull', clip: 'pick_and_roll_pullup', action: shot('mid', -0.15, 0.05, 0.03) },
      { id: 'drive_the_gap', clip: 'drive_layup', action: shot('rim', -0.3, 0.22, 0.07) },
    ],
  },

  // ---------------------------------------------------------------- reading the defence

  {
    id: 'floater_in_the_lane',
    trigger: { side: 'offense', clockOver: 120, styles: ['playmaker', 'slasher', 'shooter'] },
    weight: 3,
    options: [
      { id: 'float_it', clip: 'floater', action: shot('mid', 0.1, 0.04, 0.03) },
      { id: 'go_all_the_way', clip: 'drive_layup', action: shot('rim', -0.3, 0.22, 0.07) },
      { id: 'lob_it', clip: 'alley_oop', action: pass('rim', 0.35, 0.09) },
    ],
  },
  {
    id: 'shot_clock_bailout',
    trigger: { side: 'offense', clockOver: 120 },
    weight: 2,
    options: [
      { id: 'step_back', clip: 'step_back_three', action: shot('three', -0.5, 0.03, 0.04) },
      { id: 'bully_to_the_rim', clip: 'free_throws', action: shot('rim', -0.4, 0.3, 0.08) },
      { id: 'tough_floater', clip: 'floater', action: shot('mid', -0.2, 0.05, 0.04) },
    ],
  },
  {
    id: 'zone_look',
    trigger: { side: 'offense', clockOver: 120, styles: ['shooter', 'playmaker', 'bigMan'] },
    weight: 2,
    options: [
      { id: 'flash_high_post', clip: 'post_up', action: shot('mid', 0.1, 0.04, 0.04) },
      { id: 'skip_pass', clip: 'drive_and_kick', action: pass('three', 0.3, 0.08) },
      { id: 'shoot_over_it', clip: 'catch_shoot_three', action: shot('three', 0, 0.01, 0.02) },
    ],
  },
  {
    id: 'heat_check',
    trigger: { side: 'offense', clockOver: 120, roles: ['starter', 'star'] },
    weight: 2,
    options: [
      {
        id: 'heat_check',
        clip: 'step_back_three',
        requires: { form: 'hot' },
        action: shot('three', -0.3, 0.02, 0.02),
      },
      { id: 'run_the_set', clip: 'pick_and_roll_pullup', action: shot('mid', 0, 0.04, 0.03) },
      { id: 'attack_the_mismatch', clip: 'drive_layup', action: shot('rim', -0.1, 0.16, 0.06) },
      { id: 'move_it_on', clip: 'drive_and_kick', action: pass('three', 0.15, 0.04) },
    ],
  },
  {
    id: 'offensive_rebound',
    trigger: { side: 'offense', clockOver: 120, styles: ['bigMan', 'defender'] },
    weight: 3,
    options: [
      { id: 'put_it_back', clip: 'put_back', action: shot('rim', 0.1, 0.18, 0.04) },
      { id: 'reset_the_offence', clip: 'drive_and_kick', action: pass('three', 0.2, 0.03) },
      { id: 'go_up_strong', clip: 'put_back', action: shot('rim', -0.1, 0.32, 0.07) },
    ],
  },
  {
    id: 'lob_threat',
    trigger: { side: 'offense', clockOver: 120, styles: ['bigMan', 'slasher'] },
    weight: 3,
    options: [
      {
        id: 'catch_the_lob',
        clip: 'alley_oop',
        requires: { skillsMin: { athleticism: 55 } },
        action: shot('rim', 0.1, 0.1, 0.08),
      },
      { id: 'seal_and_post', clip: 'post_up', action: shot('post', 0.05, 0.15, 0.05) },
      { id: 'pop_out', clip: 'catch_shoot_three', action: shot('three', -0.1, 0.01, 0.02) },
      { id: 'short_roll_pass', clip: 'pick_and_roll_roll', action: pass('three', 0.2, 0.06) },
    ],
  },
  {
    id: 'post_double_down',
    trigger: { side: 'offense', clockOver: 120, styles: ['bigMan'] },
    weight: 3,
    options: [
      { id: 'spin_baseline', clip: 'post_up', action: shot('post', -0.2, 0.2, 0.08) },
      { id: 'pass_out_of_it', clip: 'drive_and_kick', action: pass('three', 0.25, 0.07) },
      { id: 'up_and_under', clip: 'post_up', action: shot('post', 0, 0.26, 0.05) },
    ],
  },
  {
    id: 'steal_and_go',
    trigger: { side: 'offense', transition: true, styles: ['defender', 'slasher', 'playmaker'] },
    weight: 3,
    options: [
      { id: 'lay_it_in', clip: 'steal_runout', action: shot('rim', 0.3, 0.15, 0.03) },
      { id: 'wait_for_the_trailer', clip: 'fast_break', action: pass('three', 0.3, 0.05) },
      {
        id: 'windmill',
        clip: 'steal_runout',
        requires: { traitsAny: ['bouncy'] },
        action: shot('rim', 0.05, 0.1, 0.06),
      },
      { id: 'pull_it_out', clip: 'pick_and_roll_pullup', action: pass('mid', 0, 0.02) },
    ],
  },

  // ---------------------------------------------------------------- defence

  {
    id: 'outnumbered_back',
    trigger: { side: 'defense', transition: true },
    weight: 4,
    options: [
      { id: 'take_the_charge', clip: 'charge', action: defend(0.5, 0.15) },
      { id: 'stay_between', clip: 'block', action: defend(0.05, 0.05) },
      { id: 'jump_the_pass', clip: 'steal_runout', action: defend(0.8, 0.08) },
    ],
  },
  {
    id: 'chase_down',
    trigger: { side: 'defense', transition: true, styles: ['bigMan', 'defender', 'slasher'] },
    weight: 3,
    options: [
      { id: 'chase_it_down', clip: 'block', action: defend(0.6, 0.12) },
      { id: 'contest_without_jumping', clip: 'block', action: defend(0.1, 0.03) },
      {
        id: 'pin_it',
        clip: 'block',
        requires: { traitsAny: ['bouncy', 'rim_protector'] },
        action: defend(0.45, 0.08),
      },
    ],
  },
  {
    id: 'inbound_deny',
    trigger: {
      side: 'defense',
      lastPeriodOnly: true,
      clockUnder: 30,
      margin: [1, 2],
    },
    weight: 6,
    options: [
      { id: 'deny_the_catch', clip: 'steal_runout', action: defend(0.45, 0.06) },
      { id: 'switch_everything', clip: 'block', action: defend(0.1, 0.04) },
      { id: 'guard_the_inbounder', clip: 'steal_runout', action: defend(0.25, 0.03) },
    ],
  },
  {
    id: 'up_three_foul',
    trigger: {
      side: 'defense',
      lastPeriodOnly: true,
      clockUnder: 8,
      margin: [3, 3],
    },
    weight: 8,
    options: [
      { id: 'foul_now', clip: 'free_throws', action: defend(0.2, 0.6) },
      { id: 'run_him_off_the_line', clip: 'block', action: defend(0.05, 0.04) },
      { id: 'top_lock_the_shooter', clip: 'steal_runout', action: defend(0.4, 0.06) },
    ],
  },
  {
    id: 'pick_and_roll_defence',
    trigger: { side: 'defense', clockOver: 120, styles: ['bigMan', 'defender'] },
    weight: 2,
    options: [
      { id: 'hedge_hard', clip: 'steal_runout', action: defend(0.45, 0.1) },
      { id: 'drop_back', clip: 'block', action: defend(0.05, 0.04) },
      { id: 'switch_it', clip: 'block', action: defend(0.2, 0.06) },
    ],
  },
  {
    id: 'closeout',
    trigger: { side: 'defense', clockOver: 120, styles: ['shooter', 'playmaker', 'slasher'] },
    weight: 1,
    options: [
      { id: 'fly_at_him', clip: 'block', action: defend(0.5, 0.12) },
      { id: 'short_closeout', clip: 'block', action: defend(0.1, 0.03) },
      { id: 'take_away_the_three', clip: 'steal_runout', action: defend(0.3, 0.05) },
    ],
  },
  {
    id: 'loose_ball',
    trigger: { side: 'defense', clockOver: 120 },
    weight: 1,
    options: [
      { id: 'dive_for_it', clip: 'steal_runout', action: defend(0.75, 0.1) },
      { id: 'stay_on_your_feet', clip: 'steal_runout', action: defend(0.25, 0.04) },
    ],
  },
  {
    id: 'late_switch_mismatch',
    trigger: {
      side: 'defense',
      lastPeriodOnly: true,
      clockUnder: 60,
      margin: [-3, 3],
      styles: ['shooter', 'playmaker'],
    },
    weight: 5,
    options: [
      { id: 'front_the_post', clip: 'steal_runout', action: defend(0.4, 0.08) },
      { id: 'push_him_off_the_block', clip: 'charge', action: defend(0.15, 0.2) },
      { id: 'call_for_help', clip: 'block', action: defend(0, 0.03) },
    ],
  },
  {
    id: 'bench_pressure',
    trigger: { side: 'defense', clockOver: 120, roles: ['bench', 'rotation'] },
    weight: 2,
    options: [
      { id: 'pick_him_up_full_court', clip: 'steal_runout', action: defend(0.55, 0.1) },
      { id: 'stay_solid', clip: 'block', action: defend(0.05, 0.03) },
      { id: 'draw_the_charge', clip: 'charge', action: defend(0.4, 0.12) },
    ],
  },

  // ---------------------------------------------------------------- occasions

  {
    id: 'rivalry_isolation',
    trigger: { side: 'offense', contexts: ['rivalry'] },
    weight: 8,
    options: [
      { id: 'isolate_him', clip: 'iso_pullup', action: shot('mid', -0.15, 0.05, 0.04) },
      { id: 'post_him_up', clip: 'post_up', action: shot('post', -0.05, 0.15, 0.05) },
      { id: 'make_him_chase', clip: 'pick_and_roll_pullup', action: shot('mid', 0, 0.04, 0.03) },
      { id: 'let_it_go', clip: 'drive_and_kick', action: pass('three', 0.2, 0.04) },
    ],
  },
  {
    id: 'rivalry_defend',
    trigger: { side: 'defense', contexts: ['rivalry'] },
    weight: 8,
    options: [
      { id: 'crowd_him', clip: 'steal_runout', action: defend(0.35, 0.08) },
      { id: 'make_him_shoot_over_you', clip: 'block', action: defend(0, 0.03) },
      { id: 'beat_him_to_the_spot', clip: 'charge', action: defend(0.3, 0.12) },
    ],
  },
  {
    id: 'international_physical',
    trigger: { side: 'offense', contexts: ['international'] },
    weight: 5,
    options: [
      { id: 'euro_step', clip: 'drive_layup', action: shot('rim', -0.2, 0.2, 0.06) },
      { id: 'roll_it_to_the_big', clip: 'pick_and_roll_roll', action: pass('rim', 0.3, 0.08) },
      { id: 'corner_three', clip: 'catch_shoot_three', action: shot('three', 0, 0.01, 0.02) },
    ],
  },
  {
    id: 'international_shooter',
    trigger: { side: 'defense', lastPeriodOnly: true, contexts: ['international'] },
    weight: 5,
    options: [
      { id: 'trail_every_screen', clip: 'steal_runout', action: defend(0.3, 0.06) },
      { id: 'go_under', clip: 'block', action: defend(0.05, 0.02) },
      { id: 'switch_and_talk', clip: 'block', action: defend(0.15, 0.04) },
    ],
  },
  {
    id: 'tournament_opening',
    trigger: { side: 'offense', clockOver: 500, contexts: ['tournament'] },
    weight: 4,
    options: [
      { id: 'easy_one_first', clip: 'drive_layup', action: shot('rim', 0.1, 0.12, 0.05) },
      { id: 'first_shot_three', clip: 'catch_shoot_three', action: shot('three', 0, 0.01, 0.02) },
      { id: 'find_a_teammate', clip: 'pick_and_roll_roll', action: pass('rim', 0.3, 0.05) },
    ],
  },
  {
    id: 'exhibition_experiment',
    trigger: { side: 'offense', contexts: ['exhibition'] },
    weight: 12,
    options: [
      { id: 'new_step_back', clip: 'step_back_three', action: shot('three', -0.35, 0.02, 0.03) },
      { id: 'left_hand_floater', clip: 'floater', action: shot('mid', -0.15, 0.04, 0.04) },
      { id: 'post_the_guard', clip: 'post_up', action: shot('post', 0, 0.15, 0.05) },
    ],
  },
  {
    id: 'showcase_defence',
    trigger: { side: 'defense', contexts: ['showcase'] },
    weight: 15,
    options: [
      { id: 'pick_his_pocket', clip: 'steal_runout', action: defend(0.6, 0.1) },
      { id: 'meet_him_at_the_rim', clip: 'block', action: defend(0.3, 0.1) },
      { id: 'just_guard_him', clip: 'block', action: defend(0, 0.03) },
    ],
  },
  {
    id: 'garbage_time',
    trigger: { side: 'offense', lastPeriodOnly: true, clockUnder: 240, margin: [15, 80] },
    weight: 3,
    options: [
      { id: 'lob_for_the_walk_on', clip: 'alley_oop', action: pass('rim', 0.3, 0.08) },
      { id: 'one_for_yourself', clip: 'catch_shoot_three', action: shot('three', 0.1, 0.01, 0.01) },
      { id: 'run_the_clock', clip: 'pick_and_roll_pullup', action: pass('mid', 0, 0.01) },
    ],
  },
  {
    id: 'down_big_pride',
    trigger: { side: 'offense', lastPeriodOnly: true, clockUnder: 300, margin: [-80, -15] },
    weight: 3,
    options: [
      { id: 'attack_the_rim', clip: 'drive_layup', action: shot('rim', 0, 0.18, 0.05) },
      { id: 'hunt_your_shot', clip: 'iso_pullup', action: shot('mid', -0.1, 0.04, 0.03) },
      { id: 'run_the_offence', clip: 'drive_and_kick', action: pass('three', 0.15, 0.04) },
    ],
  },
  {
    id: 'ankle_late',
    trigger: { side: 'any', hurt: true, lastPeriodOnly: true, clockUnder: 300 },
    weight: 50,
    options: [
      { id: 'stay_in', clip: 'checkup', action: { kind: 'pain', playThrough: true } },
      { id: 'come_out', clip: 'checkup', action: { kind: 'pain', playThrough: false } },
      {
        id: 'tape_it_tighter',
        clip: 'checkup',
        requires: { traitsAny: ['tough_as_nails', 'iron_man'] },
        action: { kind: 'pain', playThrough: true },
      },
      {
        id: 'numb_it',
        clip: 'checkup',
        requires: { flagsAll: ['painkillers'] },
        action: { kind: 'pain', playThrough: true },
      },
    ],
  },
];
