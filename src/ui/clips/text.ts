/** English text for the clips: phase labels, results and controls. A `text` prop can replace it. */

import { periodLabel, type SceneLabels } from './scene';
import type { Play } from './types';

export interface ClipText {
  /** Labels by phase key: template ids, shot kinds (shot_*) and results. */
  readonly phases: Readonly<Record<string, string>>;
  readonly replay: string;
  readonly skip: string;
  readonly play: string;
  readonly playAgain: string;
}

export const clipTextEn: ClipText = {
  phases: {
    intro_fast_break: 'Fast break',
    intro_pick_and_roll_pullup: 'Pick and roll',
    intro_pick_and_roll_roll: 'Pick and roll',
    intro_iso_pullup: 'Isolation',
    intro_step_back_three: 'Isolation',
    intro_catch_shoot_three: 'Drive and kick',
    intro_drive_layup: 'Attacking the rim',
    intro_drive_and_kick: 'Drive and kick',
    intro_post_up: 'Post-up',
    intro_floater: 'Into the lane',
    intro_alley_oop: 'Backdoor',
    intro_put_back: 'On the glass',
    intro_block: 'Rim protection',
    intro_steal_runout: 'Passing lane',
    intro_charge: 'Help defence',
    intro_checkup: 'Injury check',
    intro_last_second_heave: 'Last shot',
    intro_free_throws: 'Free throws',
    shot_layup: 'Layup',
    shot_dunk: 'Dunk',
    shot_oop: 'Alley-oop',
    shot_jumper: 'Pull-up',
    shot_three: 'For three',
    shot_floater: 'Floater',
    shot_hook: 'Hook',
    shot_tip: 'Put-back',
    shot_heave: 'From way out',
    shot_ft: 'At the line',
    ft1: 'One down',
    make: 'Good',
    miss: 'No good',
    blocked: 'Blocked',
    block: 'Rejected',
    stripped: 'Stripped',
    steal: 'Steal',
    pickedOff: 'Picked off',
    charge: 'Charge',
    deflect: 'Deflected',
    foulMake: 'Foul, and it counts',
    scored: 'Scored on',
    stop: 'Stop',
    playThrough: 'Back in',
    sit: 'Heading to the bench',
    ftBoth: 'Two of two',
    ftSplit: 'One of two',
  },
  replay: 'Replay',
  skip: 'Skip to the result',
  play: 'Play the clip',
  playAgain: 'Play again',
};

/** Resolves the per-play labels the scene draws. */
export function sceneLabels(
  play: Play,
  text: ClipText,
  abbr: readonly [string, string],
): SceneLabels {
  const phases = play.phaseKey.map((k) =>
    (text.phases[k] ?? clipTextEn.phases[k] ?? '').toUpperCase(),
  );
  return {
    phases,
    replay: text.replay.toUpperCase(),
    period: periodLabel(play.period, play.periods),
    abbr,
  };
}

/** The result in words, for reduced motion and screen readers. */
export function resultText(play: Play, text: ClipText): string {
  const key = play.phaseKey[play.phaseKey.length - 1] ?? '';
  return text.phases[key] ?? clipTextEn.phases[key] ?? '';
}
