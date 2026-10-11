/** Play templates the clip renderer provides (Phase 3). Moments may only reference these. */
export const CLIP_TEMPLATES = [
  'iso_pullup',
  'step_back_three',
  'catch_shoot_three',
  'drive_layup',
  'pick_and_roll_pullup',
  'pick_and_roll_roll',
  'drive_and_kick',
  'post_up',
  'fast_break',
  'alley_oop',
  'block',
  'steal_runout',
  'charge',
  'checkup',
] as const;

export type ClipTemplate = (typeof CLIP_TEMPLATES)[number];
