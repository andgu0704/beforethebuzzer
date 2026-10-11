import type { EventDef } from '@/engine/content/story-types';

import {
  chance,
  checkSkill,
  checkStatus,
  feat,
  flag,
  injury,
  later,
  post,
  rel,
  skill,
  status,
  stock,
} from './effects';

const inSeason = ['preseason', 'nonConference', 'conference'] as const;

export const events: readonly EventDef[] = [
  {
    id: 'campus_visits',
    category: 'recruiting',
    when: { stages: ['highSchool'], weeks: [15, 15] },
    weight: 100,
    once: true,
    choices: [
      {
        id: 'big_program',
        effects: [
          { kind: 'status', key: 'reputation', delta: 2 },
          { kind: 'status', key: 'confidence', delta: -1 },
        ],
      },
      { id: 'small_school', effects: [{ kind: 'status', key: 'confidence', delta: 3 }] },
      {
        id: 'skip_and_train',
        effects: [
          { kind: 'skill', skill: 'shooting', delta: 0.6 },
          { kind: 'status', key: 'energy', delta: -4 },
        ],
      },
    ],
  },
  {
    id: 'teammate_party',
    category: 'social',
    when: { stages: ['college'], phases: inSeason },
    weight: 3,
    cooldownWeeks: 10,
    cast: ['teammate'],
    choices: [
      {
        id: 'go_big',
        effects: [
          { kind: 'flag', id: 'went_to_party', set: true },
          { kind: 'status', key: 'energy', delta: -12 },
          { kind: 'status', key: 'chemistry', delta: 4 },
          { kind: 'relation', who: 'teammates', delta: 5 },
          { kind: 'later', consequence: 'coach_finds_out', inWeeks: [1, 2], chance: 0.45 },
        ],
      },
      {
        id: 'cameo',
        effects: [
          { kind: 'status', key: 'chemistry', delta: 2 },
          { kind: 'status', key: 'energy', delta: -3 },
        ],
      },
      {
        id: 'stay_in',
        effects: [
          { kind: 'status', key: 'energy', delta: 4 },
          { kind: 'status', key: 'chemistry', delta: -2 },
        ],
      },
    ],
  },
  {
    id: 'coach_heard_about_party',
    category: 'coach',
    when: { stages: ['college'], flagRecent: { id: 'went_to_party', withinWeeks: 3 } },
    weight: 1,
    cooldownWeeks: 20,
    cast: ['coach', 'teammate'],
    choices: [
      {
        id: 'own_it',
        effects: [
          { kind: 'relation', who: 'coach', delta: 4 },
          { kind: 'status', key: 'coachTrust', delta: 3 },
          { kind: 'flag', id: 'owned_party', set: true },
        ],
      },
      {
        id: 'blame_teammate',
        effects: [
          { kind: 'relation', who: 'teammates', delta: -8 },
          { kind: 'status', key: 'coachTrust', delta: -1 },
          { kind: 'later', consequence: 'locker_room_leak', inWeeks: [2, 6], chance: 0.6 },
        ],
      },
      {
        id: 'offer_film',
        requires: { traitsAny: ['film_junkie', 'gym_rat'] },
        effects: [
          { kind: 'status', key: 'coachTrust', delta: 6 },
          { kind: 'feat', feat: 'filmBlocks', delta: 3 },
        ],
      },
    ],
  },
  {
    id: 'tutor_offer',
    category: 'academics',
    when: { stages: ['college'], status: { gpa: [0, 2.45] } },
    weight: 4,
    cooldownWeeks: 16,
    choices: [
      {
        id: 'hire_tutor',
        effects: [
          { kind: 'status', key: 'money', delta: -300 },
          { kind: 'status', key: 'gpa', delta: 0.25 },
          { kind: 'flag', id: 'has_tutor', set: true },
        ],
      },
      {
        id: 'copy_homework',
        effects: [
          { kind: 'status', key: 'gpa', delta: 0.35 },
          { kind: 'later', consequence: 'academic_investigation', inWeeks: [4, 10], chance: 0.4 },
        ],
      },
      { id: 'wing_it', effects: [{ kind: 'status', key: 'confidence', delta: 1 }] },
    ],
  },
  {
    id: 'beat_writer_interview',
    category: 'media',
    when: { stages: ['college', 'prospect'] },
    weight: 2,
    cooldownWeeks: 12,
    cast: ['journalist'],
    choices: [
      {
        id: 'open_up',
        effects: [
          { kind: 'relation', who: 'journalist', delta: 10 },
          { kind: 'status', key: 'reputation', delta: 2 },
          {
            kind: 'chance',
            p: 0.2,
            then: [
              { kind: 'status', key: 'coachTrust', delta: -3 },
              { kind: 'flag', id: 'misquoted', set: true },
            ],
          },
        ],
      },
      { id: 'cliches', effects: [{ kind: 'relation', who: 'journalist', delta: -2 }] },
      {
        id: 'decline',
        effects: [
          { kind: 'relation', who: 'journalist', delta: -6 },
          { kind: 'status', key: 'energy', delta: 2 },
        ],
      },
    ],
  },
  {
    id: 'minutes_talk',
    category: 'coach',
    when: { stages: ['college'], roles: ['bench', 'rotation'], phases: inSeason },
    weight: 3,
    cooldownWeeks: 8,
    cast: ['coach'],
    choices: [
      {
        id: 'ask_for_minutes',
        effects: [
          {
            kind: 'check',
            status: 'coachTrust',
            against: 55,
            then: [{ kind: 'status', key: 'coachTrust', delta: 4 }],
            otherwise: [
              { kind: 'status', key: 'coachTrust', delta: -4 },
              { kind: 'status', key: 'confidence', delta: -2 },
            ],
          },
        ],
      },
      {
        id: 'work_quietly',
        effects: [
          { kind: 'status', key: 'coachTrust', delta: 4 },
          { kind: 'status', key: 'confidence', delta: -2 },
        ],
      },
      {
        id: 'threaten_transfer',
        effects: [
          { kind: 'status', key: 'coachTrust', delta: -10 },
          { kind: 'status', key: 'reputation', delta: 1 },
          { kind: 'flag', id: 'threatened_transfer', set: true },
        ],
      },
    ],
  },
  {
    id: 'local_sponsor',
    category: 'money',
    when: { stages: ['college'], status: { reputation: [25, 100] } },
    weight: 2,
    cooldownWeeks: 20,
    choices: [
      {
        id: 'sign',
        effects: [
          { kind: 'status', key: 'money', delta: 1500 },
          { kind: 'flag', id: 'local_deal', set: true },
          { kind: 'social', template: 'event_tyre_ad' },
          { kind: 'status', key: 'coachTrust', delta: -1 },
        ],
      },
      {
        id: 'negotiate',
        effects: [
          {
            kind: 'check',
            status: 'reputation',
            against: 45,
            then: [{ kind: 'status', key: 'money', delta: 3200 }],
            otherwise: [{ kind: 'status', key: 'reputation', delta: -1 }],
          },
        ],
      },
      { id: 'decline', effects: [{ kind: 'status', key: 'coachTrust', delta: 1 }] },
    ],
  },
  {
    id: 'rival_trash_talk',
    category: 'rival',
    when: { stages: ['college', 'prospect'] },
    weight: 2,
    cooldownWeeks: 14,
    cast: ['rival'],
    choices: [
      {
        id: 'fire_back',
        effects: [
          { kind: 'status', key: 'confidence', delta: 3 },
          { kind: 'status', key: 'reputation', delta: 2 },
          { kind: 'relation', who: 'rival', delta: -10 },
          { kind: 'flag', id: 'feud_with_rival', set: true },
        ],
      },
      {
        id: 'stay_classy',
        effects: [
          { kind: 'status', key: 'reputation', delta: 1 },
          { kind: 'social', template: 'event_rival_classy' },
          { kind: 'status', key: 'coachTrust', delta: 1 },
        ],
      },
      { id: 'let_it_ride', effects: [{ kind: 'status', key: 'confidence', delta: 1 }] },
    ],
  },
  {
    id: 'homesick',
    category: 'family',
    when: { stages: ['college'], collegeSeasons: [0, 0], phases: ['preseason', 'nonConference'] },
    weight: 3,
    once: true,
    choices: [
      {
        id: 'call_home',
        effects: [
          { kind: 'status', key: 'confidence', delta: 3 },
          { kind: 'relation', who: 'family', delta: 8 },
        ],
      },
      {
        id: 'fly_home',
        effects: [
          { kind: 'status', key: 'money', delta: -400 },
          { kind: 'status', key: 'energy', delta: 8 },
          { kind: 'relation', who: 'family', delta: 12 },
          { kind: 'status', key: 'coachTrust', delta: -2 },
        ],
      },
      { id: 'push_through', effects: [{ kind: 'status', key: 'confidence', delta: -3 }] },
      {
        id: 'lean_on_teammates',
        requires: { relations: { teammates: [58, 100] } },
        effects: [
          { kind: 'status', key: 'chemistry', delta: 3 },
          { kind: 'status', key: 'confidence', delta: 2 },
        ],
      },
    ],
  },
  {
    id: 'dawn_shooting',
    category: 'coach',
    when: { stages: ['college'] },
    weight: 2,
    cooldownWeeks: 15,
    cast: ['coach'],
    choices: [
      {
        id: 'all_in',
        effects: [
          { kind: 'skill', skill: 'shooting', delta: 1.5 },
          { kind: 'status', key: 'energy', delta: -8 },
          { kind: 'status', key: 'coachTrust', delta: 2 },
        ],
      },
      {
        id: 'some_days',
        effects: [
          { kind: 'skill', skill: 'shooting', delta: 0.6 },
          { kind: 'status', key: 'energy', delta: -3 },
        ],
      },
      { id: 'sleep_in', effects: [{ kind: 'status', key: 'energy', delta: 2 }] },
    ],
  },
  {
    id: 'sore_knee',
    category: 'health',
    when: { stages: ['college', 'prospect'], status: { health: [0, 82] } },
    weight: 3,
    cooldownWeeks: 10,
    choices: [
      {
        id: 'see_trainer',
        effects: [
          { kind: 'status', key: 'health', delta: 8 },
          {
            kind: 'chance',
            p: 0.3,
            then: [{ kind: 'injury', injury: 'kneeTendinitis', weeks: [1, 2] }],
          },
        ],
      },
      {
        id: 'ice_it',
        effects: [
          { kind: 'status', key: 'health', delta: 3 },
          { kind: 'later', consequence: 'chronic_injury', inWeeks: [4, 12], chance: 0.3 },
        ],
      },
      {
        id: 'painkillers',
        effects: [
          { kind: 'status', key: 'health', delta: 5 },
          { kind: 'flag', id: 'painkillers', set: true },
          { kind: 'later', consequence: 'chronic_injury', inWeeks: [4, 12], chance: 0.5 },
        ],
      },
    ],
  },
  {
    id: 'viral_dunk',
    category: 'social',
    when: {
      stages: ['college', 'highSchool'],
      styles: ['slasher', 'bigMan'],
      status: { reputation: [0, 65] },
    },
    weight: 2,
    cooldownWeeks: 26,
    choices: [
      {
        id: 'do_it',
        effects: [
          { kind: 'status', key: 'reputation', delta: 4 },
          { kind: 'social', template: 'event_viral_dunk' },
          {
            kind: 'chance',
            p: 0.15,
            then: [{ kind: 'injury', injury: 'ankleSprain', weeks: [1, 2] }],
          },
        ],
      },
      { id: 'decline', effects: [{ kind: 'relation', who: 'fans', delta: 2 }] },
    ],
  },
  {
    id: 'scouts_in_stands',
    category: 'draft',
    when: { stages: ['college'], phases: ['conference', 'conferenceTournament'] },
    weight: 2,
    cooldownWeeks: 20,
    choices: [
      { id: 'play_your_game', effects: [{ kind: 'status', key: 'confidence', delta: 2 }] },
      {
        id: 'hunt_shots',
        effects: [
          { kind: 'draftStock', delta: 0.5 },
          { kind: 'status', key: 'chemistry', delta: -3 },
          { kind: 'flag', id: 'chased_stats', set: true },
          { kind: 'later', consequence: 'locker_room_leak', inWeeks: [2, 5], chance: 0.35 },
        ],
      },
      { id: 'ask_coach', effects: [{ kind: 'status', key: 'coachTrust', delta: 2 }] },
    ],
  },
  {
    id: 'federation_letter',
    category: 'national',
    when: { stages: ['college'], nationStrength: [0, 72] },
    weight: 2,
    once: true,
    choices: [
      {
        id: 'commit',
        effects: [
          { kind: 'relation', who: 'nationalTeam', delta: 12 },
          { kind: 'status', key: 'reputation', delta: 2 },
        ],
      },
      { id: 'maybe_later', effects: [{ kind: 'relation', who: 'nationalTeam', delta: -2 }] },
      {
        id: 'say_no',
        effects: [
          { kind: 'relation', who: 'nationalTeam', delta: -12 },
          { kind: 'status', key: 'energy', delta: 2 },
        ],
      },
    ],
  },
  {
    id: 'envelope',
    category: 'money',
    when: { stages: ['college'], status: { reputation: [35, 100] } },
    weight: 1,
    once: true,
    choices: [
      {
        id: 'take_it',
        effects: [
          { kind: 'status', key: 'money', delta: 5000 },
          { kind: 'later', consequence: 'eligibility_scandal', inWeeks: [6, 20], chance: 0.45 },
        ],
      },
      {
        id: 'report_it',
        effects: [
          { kind: 'status', key: 'coachTrust', delta: 4 },
          { kind: 'status', key: 'reputation', delta: 2 },
        ],
      },
      { id: 'walk_away', effects: [] },
    ],
  },
  {
    id: 'slump_film',
    category: 'coach',
    when: { stages: ['college'], form: 'slump' },
    weight: 6,
    cooldownWeeks: 6,
    cast: ['coach'],
    choices: [
      {
        id: 'stay_late',
        effects: [
          { kind: 'status', key: 'confidence', delta: 5 },
          { kind: 'status', key: 'coachTrust', delta: 3 },
          { kind: 'status', key: 'energy', delta: -4 },
          { kind: 'feat', feat: 'filmBlocks', delta: 2 },
        ],
      },
      {
        id: 'skip_it',
        effects: [
          { kind: 'status', key: 'coachTrust', delta: -3 },
          { kind: 'status', key: 'energy', delta: 2 },
        ],
      },
    ],
  },
  {
    id: 'roommate',
    category: 'campus',
    when: { stages: ['college'], collegeSeasons: [0, 1] },
    weight: 2,
    once: true,
    cast: ['teammate'],
    choices: [
      {
        id: 'talk_it_out',
        effects: [
          { kind: 'status', key: 'chemistry', delta: 3 },
          { kind: 'status', key: 'energy', delta: -2 },
        ],
      },
      {
        id: 'switch_rooms',
        effects: [
          { kind: 'status', key: 'money', delta: -200 },
          { kind: 'status', key: 'chemistry', delta: -1 },
          { kind: 'status', key: 'energy', delta: 3 },
        ],
      },
      { id: 'headphones', effects: [{ kind: 'status', key: 'chemistry', delta: -2 }] },
    ],
  },
  {
    id: 'mock_draft_slide',
    category: 'draft',
    when: { stages: ['prospect'], declared: true },
    weight: 4,
    cooldownWeeks: 4,
    choices: [
      { id: 'tune_out', effects: [{ kind: 'status', key: 'confidence', delta: 2 }] },
      {
        id: 'call_agent',
        requires: { hasAgent: true },
        effects: [
          { kind: 'relation', who: 'agent', delta: 5 },
          { kind: 'draftStock', delta: 0.3 },
        ],
      },
      {
        id: 'extra_workouts',
        effects: [
          { kind: 'status', key: 'energy', delta: -6 },
          { kind: 'skill', skill: 'athleticism', delta: 0.5 },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- the last spring at home

  {
    id: 'prom_or_camp',
    category: 'social',
    when: { stages: ['highSchool'], weeks: [17, 22] },
    weight: 4,
    once: true,
    choices: [
      {
        id: 'prom',
        effects: [status('confidence', 3), rel('family', 4), status('energy', -2)],
      },
      {
        id: 'elite_camp',
        effects: [skill('gameSense', 0.5), status('reputation', 1), status('energy', -6)],
      },
      {
        id: 'both',
        effects: [
          status('energy', -12),
          status('confidence', 2),
          rel('family', 2),
          status('reputation', 1),
        ],
      },
    ],
  },
  {
    id: 'hs_coach_keys',
    category: 'coach',
    when: { stages: ['highSchool'], weeks: [17, 26] },
    weight: 3,
    once: true,
    choices: [
      {
        id: 'take_the_key',
        effects: [skill('shooting', 0.6), status('energy', -5), flag('hs_gym_key')],
      },
      { id: 'thank_him', effects: [rel('fans', 4), status('confidence', 1)] },
      { id: 'hand_it_back', effects: [status('energy', 3)] },
    ],
  },
  {
    id: 'graduation_speech',
    category: 'family',
    when: { stages: ['highSchool'], weeks: [20, 25] },
    weight: 3,
    once: true,
    choices: [
      {
        id: 'give_speech',
        effects: [
          rel('family', 4),
          checkStatus(
            'confidence',
            50,
            [status('reputation', 2), status('confidence', 3)],
            [status('confidence', -3)],
          ),
        ],
      },
      { id: 'keep_it_short', effects: [rel('family', 3), status('reputation', 1)] },
      { id: 'decline', effects: [rel('family', -3), status('energy', 2)] },
    ],
  },
  {
    id: 'summer_job',
    category: 'money',
    when: { stages: ['highSchool'], weeks: [18, 26] },
    weight: 3,
    once: true,
    choices: [
      {
        id: 'moving_company',
        effects: [status('money', 900), status('energy', -6), skill('athleticism', 0.3)],
      },
      {
        id: 'kids_camp',
        effects: [status('money', 400), rel('fans', 4), status('confidence', 2)],
      },
      {
        id: 'train_all_summer',
        effects: [skill('handling', 0.5), status('energy', -4), status('money', -100)],
      },
      {
        id: 'run_the_old_gym',
        requires: { flagsAll: ['hs_gym_key'] },
        effects: [status('money', 500), skill('shooting', 0.3), status('energy', -4)],
      },
    ],
  },
  {
    id: 'rival_ranking_post',
    category: 'rival',
    when: { stages: ['highSchool'], weeks: [14, 26] },
    weight: 3,
    once: true,
    cast: ['rival'],
    choices: [
      {
        id: 'reply',
        effects: [
          status('confidence', 2),
          post('event_rival_reply'),
          rel('rival', -8),
          flag('feud_with_rival'),
          later('feud_reignites', [10, 22], 0.4),
        ],
      },
      { id: 'print_it', effects: [status('confidence', 2), flag('chip_on_shoulder')] },
      { id: 'congratulate', effects: [rel('rival', 6), status('reputation', 1)] },
    ],
  },
  {
    id: 'flip_call',
    category: 'recruiting',
    when: { stages: ['highSchool'], weeks: [17, 26] },
    weight: 4,
    once: true,
    choices: [
      { id: 'stay_committed', effects: [status('coachTrust', 3), status('confidence', 1)] },
      {
        id: 'hear_him_out',
        effects: [status('reputation', 1), later('flip_rumour', [4, 12], 0.5)],
      },
      { id: 'hand_phone_to_mother', effects: [rel('family', 5), status('confidence', 1)] },
    ],
  },
  {
    id: 'hometown_paper',
    category: 'media',
    when: { stages: ['highSchool'], weeks: [14, 26] },
    weight: 2,
    once: true,
    cast: ['journalist'],
    choices: [
      {
        id: 'pose_at_court',
        effects: [
          status('reputation', 2),
          rel('fans', 4),
          rel('journalist', 4),
          post('event_hometown_photo'),
        ],
      },
      {
        id: 'bring_family',
        effects: [rel('family', 6), rel('journalist', 2), status('reputation', 1)],
      },
      { id: 'decline', effects: [rel('journalist', -4), status('energy', 1)] },
    ],
  },
  {
    id: 'last_pickup_run',
    category: 'social',
    when: { stages: ['highSchool'], weeks: [22, 26] },
    weight: 3,
    once: true,
    choices: [
      {
        id: 'play_all_night',
        effects: [
          status('confidence', 3),
          rel('fans', 3),
          chance(0.1, [injury('fingerSprain', [1, 1])]),
        ],
      },
      { id: 'referee', effects: [rel('fans', 2), status('confidence', 1)] },
      { id: 'skip_it', effects: [status('energy', 3), rel('fans', -2)] },
    ],
  },

  // ---------------------------------------------------------------- coaches

  {
    id: 'conditioning_after_loss',
    category: 'coach',
    when: { stages: ['college'], phases: ['nonConference', 'conference'], lastGame: 'loss' },
    weight: 3,
    cooldownWeeks: 10,
    cast: ['coach'],
    choices: [
      {
        id: 'lead_the_sprints',
        effects: [status('energy', -7), status('chemistry', 3), status('coachTrust', 3)],
      },
      { id: 'do_the_minimum', effects: [status('energy', -4), status('coachTrust', -1)] },
      { id: 'complain', effects: [rel('teammates', 4), status('coachTrust', -4)] },
      {
        id: 'take_the_blame',
        requires: { flagsAll: ['team_captain'] },
        effects: [status('energy', -5), status('chemistry', 5), status('coachTrust', 4)],
      },
    ],
  },
  {
    id: 'coach_hot_seat',
    category: 'coach',
    when: { stages: ['college'], phases: ['conference'] },
    weight: 2,
    once: true,
    cast: ['coach'],
    choices: [
      {
        id: 'back_him_publicly',
        effects: [
          status('coachTrust', 5),
          status('reputation', -1),
          post('event_backed_coach'),
          later('coach_survives', [4, 12], 0.6),
        ],
      },
      { id: 'stay_neutral', effects: [status('confidence', 1)] },
      {
        id: 'check_the_portal',
        requires: { flagsAll: ['threatened_transfer'] },
        effects: [status('reputation', 1), status('coachTrust', -4), status('confidence', 2)],
      },
    ],
  },
  {
    id: 'coach_holiday_dinner',
    category: 'coach',
    when: { stages: ['college'], weeks: [47, 48] },
    weight: 3,
    cooldownWeeks: 40,
    cast: ['coach'],
    choices: [
      {
        id: 'go_to_dinner',
        effects: [status('coachTrust', 3), status('chemistry', 2), status('energy', -1)],
      },
      {
        id: 'fly_home',
        effects: [rel('family', 8), status('money', -500), status('energy', -3)],
      },
      {
        id: 'call_from_the_porch',
        effects: [status('coachTrust', 2), rel('family', 3), status('energy', -2)],
      },
    ],
  },

  // ---------------------------------------------------------------- the team

  {
    id: 'captain_vote',
    category: 'team',
    when: { stages: ['college'], collegeSeasons: [1, 3], phases: ['preseason'] },
    weight: 4,
    once: true,
    choices: [
      {
        id: 'campaign',
        effects: [
          checkStatus(
            'chemistry',
            55,
            [
              flag('team_captain'),
              status('coachTrust', 3),
              status('confidence', 2),
              post('event_captain'),
            ],
            [status('confidence', -2), status('chemistry', -1)],
          ),
        ],
      },
      { id: 'nominate_teammate', effects: [status('chemistry', 4), rel('teammates', 5)] },
      {
        id: 'lead_by_example',
        requires: { traitsAny: ['natural_leader', 'glue_guy'] },
        effects: [
          flag('team_captain'),
          status('chemistry', 3),
          status('coachTrust', 2),
          post('event_captain'),
        ],
      },
    ],
  },
  {
    id: 'locker_room_scuffle',
    category: 'team',
    when: { stages: ['college'], phases: inSeason },
    weight: 2,
    cooldownWeeks: 20,
    cast: ['teammate', 'starTeammate'],
    choices: [
      {
        id: 'step_in',
        effects: [status('chemistry', 4), chance(0.15, [injury('fingerSprain', [1, 1])])],
      },
      { id: 'get_the_coach', effects: [status('coachTrust', 2), rel('teammates', -6)] },
      { id: 'stay_out', effects: [status('chemistry', -3)] },
      {
        id: 'captain_call',
        requires: { flagsAll: ['team_captain'] },
        effects: [status('chemistry', 6), status('coachTrust', 2)],
      },
    ],
  },
  {
    id: 'star_freezes_you_out',
    category: 'team',
    when: {
      stages: ['college'],
      roles: ['rotation', 'starter'],
      phases: ['nonConference', 'conference'],
    },
    weight: 2,
    cooldownWeeks: 14,
    cast: ['starTeammate'],
    choices: [
      {
        id: 'talk_to_him',
        effects: [
          checkStatus(
            'chemistry',
            50,
            [status('chemistry', 4), status('confidence', 2)],
            [status('chemistry', -2), rel('teammates', -3)],
          ),
        ],
      },
      { id: 'tell_the_coach', effects: [status('coachTrust', 1), rel('teammates', -5)] },
      { id: 'cut_harder', effects: [status('energy', -5), skill('gameSense', 0.4)] },
      {
        id: 'set_screens_for_him',
        requires: { traitsAny: ['glue_guy', 'table_setter', 'floor_general'] },
        effects: [status('chemistry', 5), status('coachTrust', 2)],
      },
    ],
  },
  {
    id: 'group_chat_screenshot',
    category: 'team',
    when: { stages: ['college'] },
    weight: 2,
    cooldownWeeks: 26,
    cast: ['teammate'],
    choices: [
      { id: 'delete_and_warn', effects: [status('chemistry', 2), rel('teammates', 3)] },
      { id: 'forward_to_coach', effects: [status('coachTrust', 3), rel('teammates', -10)] },
      { id: 'say_nothing', effects: [later('locker_room_leak', [1, 4], 0.35)] },
    ],
  },
  {
    id: 'freshman_initiation',
    category: 'team',
    when: { stages: ['college'], collegeSeasons: [0, 0], phases: ['preseason'] },
    weight: 4,
    once: true,
    choices: [
      { id: 'sing_badly', effects: [status('chemistry', 4), status('confidence', -1)] },
      {
        id: 'sing_from_home',
        effects: [
          status('chemistry', 5),
          status('reputation', 1),
          status('confidence', -2),
          post('event_freshman_song'),
        ],
      },
      {
        id: 'refuse',
        effects: [status('confidence', 2), status('chemistry', -3), rel('teammates', -4)],
      },
    ],
  },
  {
    id: 'mentor_freshman',
    category: 'team',
    when: { stages: ['college'], collegeSeasons: [1, 3], phases: ['preseason', 'nonConference'] },
    weight: 3,
    once: true,
    cast: ['teammate'],
    choices: [
      {
        id: 'take_him_on',
        effects: [
          status('energy', -4),
          status('chemistry', 3),
          feat('bondingBlocks', 2),
          later('freshman_pays_back', [6, 16], 0.6),
        ],
      },
      { id: 'one_tip', effects: [status('chemistry', 1)] },
      { id: 'not_your_job', effects: [status('chemistry', -2), status('energy', 2)] },
    ],
  },
  {
    id: 'bus_card_game',
    category: 'team',
    when: { stages: ['college'], phases: ['nonConference', 'conference'] },
    weight: 2,
    cooldownWeeks: 14,
    cast: ['teammate'],
    choices: [
      {
        id: 'play_for_money',
        effects: [
          status('chemistry', 2),
          chance(0.5, [status('money', 150)], [status('money', -200)]),
        ],
      },
      { id: 'play_for_pride', effects: [status('chemistry', 3), status('energy', -2)] },
      { id: 'sleep', effects: [status('energy', 4), status('chemistry', -1)] },
    ],
  },

  // ---------------------------------------------------------------- classes

  {
    id: 'exam_on_road_trip',
    category: 'academics',
    when: { stages: ['college'], phases: ['nonConference', 'conference'] },
    weight: 3,
    cooldownWeeks: 12,
    choices: [
      { id: 'study_on_the_bus', effects: [status('gpa', 0.1), status('energy', -4)] },
      {
        id: 'ask_to_reschedule',
        effects: [chance(0.5, [status('gpa', 0.15)], [status('gpa', -0.1)])],
      },
      {
        id: 'skip_it',
        effects: [status('gpa', -0.2), status('energy', 3), later('academic_warning', [2, 6], 0.3)],
      },
      {
        id: 'call_the_tutor',
        requires: { flagsAll: ['has_tutor'] },
        effects: [status('gpa', 0.15), status('money', -100)],
      },
    ],
  },
  {
    id: 'professor_superfan',
    category: 'academics',
    when: { stages: ['college'], phases: inSeason, status: { reputation: [20, 100] } },
    weight: 2,
    once: true,
    choices: [
      {
        id: 'leave_tickets',
        effects: [status('gpa', 0.1), later('favouritism_story', [3, 10], 0.3)],
      },
      { id: 'keep_it_professional', effects: [status('gpa', 0.05)] },
      {
        id: 'talk_shop',
        requires: { traitsAny: ['student_athlete', 'film_junkie'] },
        effects: [status('gpa', 0.15), skill('gameSense', 0.3)],
      },
    ],
  },
  {
    id: 'summer_school',
    category: 'academics',
    when: { stages: ['college'], phases: ['summer'], status: { gpa: [0, 2.4] } },
    weight: 4,
    cooldownWeeks: 40,
    choices: [
      {
        id: 'enroll',
        effects: [status('gpa', 0.3), status('money', -500), status('energy', -4)],
      },
      { id: 'online_course', effects: [status('gpa', 0.15), status('energy', -2)] },
      {
        id: 'skip_summer_school',
        effects: [status('energy', 4), later('academic_warning', [8, 14], 0.5)],
      },
    ],
  },

  // ---------------------------------------------------------------- the press

  {
    id: 'student_podcast',
    category: 'media',
    when: { stages: ['college'] },
    weight: 2,
    cooldownWeeks: 16,
    choices: [
      {
        id: 'go_on',
        effects: [
          status('reputation', 2),
          post('event_podcast'),
          chance(0.25, [status('coachTrust', -3)]),
        ],
      },
      { id: 'send_a_teammate', effects: [status('chemistry', 2)] },
      { id: 'decline', effects: [status('energy', 1)] },
    ],
  },
  {
    id: 'postgame_question',
    category: 'media',
    when: { stages: ['college'], lastGame: 'loss' },
    weight: 3,
    cooldownWeeks: 10,
    cast: ['journalist', 'teammate'],
    choices: [
      {
        id: 'defend_teammate',
        effects: [status('chemistry', 3), rel('teammates', 4), rel('journalist', -2)],
      },
      { id: 'honest_answer', effects: [rel('journalist', 5), status('chemistry', -4)] },
      { id: 'deflect', effects: [rel('journalist', -1)] },
      {
        id: 'joke_it_off',
        requires: { traitsAny: ['media_darling'] },
        effects: [rel('journalist', 3), status('reputation', 2)],
      },
    ],
  },
  {
    id: 'misquote_fallout',
    category: 'media',
    when: { stages: ['college', 'prospect'], flagRecent: { id: 'misquoted', withinWeeks: 4 } },
    weight: 6,
    cooldownWeeks: 30,
    cast: ['coach', 'journalist'],
    choices: [
      { id: 'call_the_journalist', effects: [rel('journalist', -6), status('coachTrust', 2)] },
      { id: 'apologise_to_coach', effects: [status('coachTrust', 3), status('confidence', -1)] },
      { id: 'shrug', effects: [status('coachTrust', -2)] },
      {
        id: 'ask_for_correction',
        requires: { relations: { journalist: [55, 100] } },
        effects: [rel('journalist', -1), status('coachTrust', 3), status('reputation', 1)],
      },
    ],
  },
  {
    id: 'documentary_crew',
    category: 'media',
    when: { stages: ['college'], status: { reputation: [40, 100] } },
    weight: 2,
    once: true,
    choices: [
      {
        id: 'full_access',
        effects: [
          status('reputation', 4),
          status('energy', -4),
          status('coachTrust', -2),
          post('event_documentary'),
          later('documentary_edit', [4, 10], 0.4),
        ],
      },
      { id: 'games_only', effects: [status('reputation', 2)] },
      { id: 'no_cameras', effects: [status('coachTrust', 2), status('reputation', -1)] },
    ],
  },
  {
    id: 'journalist_heads_up',
    category: 'media',
    when: { stages: ['college', 'prospect'], relations: { journalist: [60, 100] } },
    weight: 2,
    cooldownWeeks: 26,
    cast: ['journalist'],
    choices: [
      {
        id: 'get_ahead_of_it',
        effects: [status('reputation', 1), status('coachTrust', 1), status('energy', -2)],
      },
      { id: 'thank_him', effects: [rel('journalist', 4)] },
      { id: 'ignore_it', effects: [later('unflattering_story', [1, 3], 0.6)] },
    ],
  },

  // ---------------------------------------------------------------- life online

  {
    id: 'fan_letter',
    category: 'social',
    when: { stages: ['college'] },
    weight: 2,
    cooldownWeeks: 30,
    choices: [
      {
        id: 'visit_the_school',
        effects: [
          rel('fans', 6),
          status('reputation', 2),
          status('energy', -3),
          post('event_fan_letter'),
        ],
      },
      { id: 'write_back', effects: [rel('fans', 3), status('confidence', 2)] },
      { id: 'post_the_letter', effects: [status('reputation', 2), rel('fans', 1)] },
    ],
  },
  {
    id: 'old_posts_resurface',
    category: 'social',
    when: { stages: ['college', 'prospect'], status: { reputation: [30, 100] } },
    weight: 2,
    once: true,
    choices: [
      { id: 'apologise', effects: [status('reputation', -1), status('coachTrust', 1)] },
      {
        id: 'make_a_joke',
        effects: [
          chance(
            0.6,
            [status('reputation', 3), rel('fans', 4), post('event_old_posts')],
            [status('reputation', -3)],
          ),
        ],
      },
      { id: 'delete_the_account', effects: [status('reputation', -2), status('energy', 2)] },
    ],
  },
  {
    id: 'phone_detox',
    category: 'social',
    when: { stages: ['college', 'prospect'], form: 'slump' },
    weight: 3,
    cooldownWeeks: 12,
    choices: [
      { id: 'delete_the_apps', effects: [status('confidence', 3), status('reputation', -1)] },
      { id: 'read_everything', effects: [status('confidence', -3), skill('gameSense', 0.3)] },
      { id: 'post_through_it', effects: [status('reputation', 2), status('confidence', -1)] },
    ],
  },

  // ---------------------------------------------------------------- family

  {
    id: 'parents_visit',
    category: 'family',
    when: { stages: ['college'], phases: ['nonConference', 'conference'] },
    weight: 2,
    cooldownWeeks: 40,
    choices: [
      { id: 'full_tour', effects: [rel('family', 8), status('energy', -4)] },
      { id: 'tickets_and_dinner', effects: [rel('family', 5), status('money', -300)] },
      { id: 'ask_them_to_wait', effects: [rel('family', -6), status('confidence', 1)] },
      {
        id: 'meet_the_coach',
        requires: { status: { coachTrust: [60, 100] } },
        effects: [rel('family', 6), status('coachTrust', 2)],
      },
    ],
  },
  {
    id: 'sibling_money',
    category: 'family',
    when: { stages: ['college', 'prospect'], status: { money: [600, 1_000_000_000] } },
    weight: 2,
    cooldownWeeks: 30,
    choices: [
      { id: 'send_it_all', effects: [status('money', -600), rel('family', 10)] },
      { id: 'send_half', effects: [status('money', -300), rel('family', 4)] },
      { id: 'not_now', effects: [rel('family', -6), status('confidence', -1)] },
      {
        id: 'cover_everything',
        requires: { flagsAll: ['nil_deal'] },
        effects: [status('money', -900), rel('family', 14)],
      },
    ],
  },
  {
    id: 'grandmother_ill',
    category: 'family',
    when: { stages: ['college'], phases: ['nonConference', 'conference'] },
    weight: 1,
    once: true,
    choices: [
      {
        id: 'fly_home',
        effects: [
          rel('family', 12),
          status('money', -700),
          status('energy', -5),
          status('coachTrust', -2),
        ],
      },
      { id: 'call_every_night', effects: [rel('family', 6), status('energy', -3)] },
      { id: 'play_for_her', effects: [status('confidence', 3), rel('family', 3)] },
    ],
  },
  {
    id: 'dad_voice_notes',
    category: 'family',
    when: { stages: ['college'], phases: ['nonConference', 'conference'] },
    weight: 2,
    cooldownWeeks: 16,
    choices: [
      { id: 'listen_to_all', effects: [skill('gameSense', 0.3), status('confidence', -2)] },
      { id: 'mute_him', effects: [status('confidence', 2), rel('family', -4)] },
      { id: 'call_him_back', effects: [rel('family', 5), status('energy', -1)] },
    ],
  },

  // ---------------------------------------------------------------- money

  {
    id: 'nil_collective',
    category: 'money',
    when: { stages: ['college'], status: { reputation: [30, 100] } },
    weight: 2,
    cooldownWeeks: 26,
    choices: [
      {
        id: 'sign_for_appearances',
        effects: [
          status('money', 2500),
          status('energy', -6),
          post('event_mattress'),
          status('coachTrust', -1),
          flag('nil_deal'),
        ],
      },
      { id: 'sign_small', effects: [status('money', 900), flag('nil_deal')] },
      { id: 'decline', effects: [status('coachTrust', 1), status('energy', 1)] },
      {
        id: 'bundle_with_tyre_shop',
        requires: { flagsAll: ['local_deal'] },
        effects: [
          status('money', 3500),
          status('reputation', 1),
          status('coachTrust', -2),
          flag('nil_deal'),
        ],
      },
    ],
  },
  {
    id: 'teammate_loan',
    category: 'money',
    when: { stages: ['college'], status: { money: [400, 1_000_000_000] } },
    weight: 2,
    cooldownWeeks: 30,
    cast: ['teammate'],
    choices: [
      {
        id: 'lend_it',
        effects: [status('money', -400), rel('teammates', 5), later('loan_repaid', [3, 10], 0.65)],
      },
      {
        id: 'give_it',
        effects: [status('money', -400), status('chemistry', 4), rel('teammates', 6)],
      },
      { id: 'say_no', effects: [rel('teammates', -4)] },
    ],
  },
  {
    id: 'coin_promotion',
    category: 'money',
    when: { stages: ['college', 'prospect'], status: { reputation: [35, 100] } },
    weight: 1,
    once: true,
    choices: [
      {
        id: 'promote_it',
        effects: [status('money', 2500), post('event_coin'), later('coin_collapse', [3, 12], 0.65)],
      },
      { id: 'decline', effects: [status('coachTrust', 1)] },
      {
        id: 'ask_agent',
        requires: { hasAgent: true },
        effects: [rel('agent', 3), status('energy', 1)],
      },
    ],
  },

  // ---------------------------------------------------------------- the body

  {
    id: 'sleep_scores',
    category: 'health',
    when: { stages: ['college', 'prospect'], status: { energy: [0, 55] } },
    weight: 3,
    cooldownWeeks: 16,
    choices: [
      { id: 'phone_out_of_room', effects: [status('energy', 8), status('reputation', -1)] },
      { id: 'nap_between_classes', effects: [status('energy', 4), status('gpa', -0.05)] },
      { id: 'ignore_the_ring', effects: [status('energy', -3), status('health', -2)] },
    ],
  },
  {
    id: 'headache_after_knock',
    category: 'health',
    when: { stages: ['college', 'prospect'], flagRecent: { id: 'played_hurt', withinWeeks: 2 } },
    weight: 5,
    cooldownWeeks: 8,
    choices: [
      {
        id: 'tell_the_trainer',
        effects: [status('health', 4), chance(0.5, [injury('concussion', [1, 2])])],
      },
      {
        id: 'sleep_it_off',
        effects: [status('energy', 2), later('concussion_returns', [1, 4], 0.35)],
      },
      { id: 'skip_film_rest', effects: [status('health', 3), status('coachTrust', -1)] },
    ],
  },

  // ---------------------------------------------------------------- the rival

  {
    id: 'rival_at_camp',
    category: 'rival',
    when: { stages: ['college'], phases: ['summer'] },
    weight: 2,
    cooldownWeeks: 40,
    cast: ['rival'],
    choices: [
      {
        id: 'guard_him',
        effects: [
          skill('defence', 0.5),
          status('energy', -5),
          rel('rival', -4),
          checkSkill('defence', 55, [status('reputation', 2)], [status('confidence', -2)]),
        ],
      },
      {
        id: 'room_with_him',
        effects: [rel('rival', 12), flag('rival_friendly'), flag('feud_with_rival', false)],
      },
      { id: 'avoid_him', effects: [status('confidence', -1), status('energy', 2)] },
      {
        id: 'outwork_him',
        requires: { flagsAll: ['chip_on_shoulder'] },
        effects: [skill('defence', 0.4), skill('shooting', 0.3), status('energy', -8)],
      },
    ],
  },
  {
    id: 'rival_injured',
    category: 'rival',
    when: { stages: ['college'], phases: ['nonConference', 'conference'] },
    weight: 1,
    once: true,
    cast: ['rival'],
    choices: [
      { id: 'send_a_message', effects: [rel('rival', 10), status('reputation', 1)] },
      { id: 'say_nothing', effects: [status('energy', 1)] },
      {
        id: 'post_publicly',
        effects: [status('reputation', 2), rel('rival', 3), post('event_kind_post')],
      },
      {
        id: 'visit_him',
        requires: { flagsAll: ['rival_friendly'] },
        effects: [rel('rival', 15), status('energy', -3), status('confidence', 1)],
      },
    ],
  },
  {
    id: 'rival_rematch_hype',
    category: 'rival',
    when: { stages: ['college'], flagsAll: ['feud_with_rival'] },
    weight: 3,
    cooldownWeeks: 20,
    cast: ['rival'],
    choices: [
      {
        id: 'add_fuel',
        effects: [
          status('reputation', 3),
          status('confidence', 2),
          status('coachTrust', -3),
          post('event_feud'),
        ],
      },
      {
        id: 'bury_it',
        effects: [rel('rival', 12), flag('feud_with_rival', false), status('reputation', 1)],
      },
      { id: 'let_the_game_talk', effects: [status('coachTrust', 2), status('confidence', 1)] },
    ],
  },

  // ---------------------------------------------------------------- the national team

  {
    id: 'national_camp',
    category: 'national',
    when: { stages: ['college'], phases: ['summer'], relations: { nationalTeam: [35, 100] } },
    weight: 2,
    cooldownWeeks: 40,
    choices: [
      {
        id: 'stay_for_all_of_it',
        effects: [rel('nationalTeam', 8), status('energy', -8), skill('gameSense', 0.4)],
      },
      { id: 'one_week', effects: [rel('nationalTeam', 3), status('energy', -3)] },
      { id: 'stay_for_classes', effects: [status('gpa', 0.1), rel('nationalTeam', -6)] },
      {
        id: 'keep_the_promise',
        requires: { flagsAll: ['promised_national'] },
        effects: [rel('nationalTeam', 10), status('energy', -6), status('reputation', 1)],
      },
    ],
  },
  {
    id: 'national_veteran_call',
    category: 'national',
    when: {
      stages: ['college'],
      nationStrength: [0, 80],
      relations: { nationalTeam: [45, 100] },
    },
    weight: 2,
    once: true,
    choices: [
      { id: 'ask_for_advice', effects: [skill('gameSense', 0.3), rel('nationalTeam', 4)] },
      {
        id: 'promise_to_come',
        effects: [flag('promised_national'), rel('nationalTeam', 6), status('reputation', 1)],
      },
      { id: 'keep_it_short', effects: [rel('nationalTeam', -1), status('energy', 1)] },
    ],
  },
  {
    id: 'declined_backlash',
    category: 'national',
    when: {
      stages: ['college', 'prospect'],
      flagRecent: { id: 'declined_national', withinWeeks: 6 },
    },
    weight: 6,
    once: true,
    choices: [
      { id: 'explain_publicly', effects: [status('reputation', 1), rel('nationalTeam', 4)] },
      {
        id: 'promise_next_time',
        effects: [rel('nationalTeam', 8), flag('promised_national'), rel('fans', 3)],
      },
      { id: 'ignore_it', effects: [rel('fans', -5)] },
    ],
  },

  // ---------------------------------------------------------------- the draft

  {
    id: 'combine_measurements',
    category: 'draft',
    when: { stages: ['prospect'], declared: true, phases: ['draftProcess'] },
    weight: 4,
    once: true,
    choices: [
      { id: 'stretch_every_morning', effects: [status('confidence', 1), status('energy', -2)] },
      { id: 'focus_on_drills', effects: [skill('shooting', 0.4), status('energy', -3)] },
      {
        id: 'skip_the_combine',
        effects: [stock(-0.3), status('energy', 6), status('confidence', 2)],
      },
    ],
  },
  {
    id: 'odd_interview_question',
    category: 'draft',
    when: { stages: ['prospect'], declared: true, phases: ['draftProcess'] },
    weight: 3,
    cooldownWeeks: 3,
    choices: [
      { id: 'answer_seriously', effects: [stock(0.15)] },
      {
        id: 'make_it_funny',
        effects: [chance(0.5, [stock(0.3), status('confidence', 2)], [stock(-0.2)])],
      },
      {
        id: 'ask_one_back',
        effects: [checkSkill('gameSense', 55, [stock(0.3)], [stock(-0.1)])],
      },
    ],
  },
  {
    id: 'head_to_head_workout',
    category: 'draft',
    when: { stages: ['prospect'], declared: true, phases: ['draftProcess'] },
    weight: 3,
    once: true,
    cast: ['rival'],
    choices: [
      {
        id: 'compete',
        effects: [
          checkSkill(
            'athleticism',
            55,
            [stock(0.4), status('confidence', 3)],
            [stock(-0.3), status('confidence', -2)],
          ),
        ],
      },
      { id: 'shooting_only', effects: [stock(0.1)] },
      {
        id: 'settle_it',
        requires: { flagsAll: ['feud_with_rival'] },
        effects: [checkSkill('defence', 55, [stock(0.5), rel('rival', -6)], [stock(-0.4)])],
      },
    ],
  },
  {
    id: 'medical_questions',
    category: 'draft',
    when: { stages: ['prospect'], declared: true, flagsAll: ['played_hurt'] },
    weight: 4,
    once: true,
    choices: [
      {
        id: 'share_everything',
        effects: [checkStatus('health', 70, [stock(0.2)], [stock(-0.3)])],
      },
      { id: 'limit_access', effects: [stock(-0.1), later('medical_rumour', [1, 3], 0.45)] },
      {
        id: 'agent_handles_it',
        requires: { hasAgent: true },
        effects: [rel('agent', 3), stock(-0.05)],
      },
      {
        id: 'mention_the_painkillers',
        requires: { flagsAll: ['painkillers'] },
        effects: [stock(-0.2), status('reputation', 1), status('confidence', 2)],
      },
    ],
  },
  {
    id: 'draft_night_party',
    category: 'draft',
    when: { stages: ['prospect'], declared: true, weeks: [22, 25] },
    weight: 4,
    once: true,
    choices: [
      {
        id: 'big_party',
        effects: [rel('family', 8), status('money', -1500), status('confidence', -1)],
      },
      { id: 'small_dinner', effects: [rel('family', 5), status('money', -300)] },
      { id: 'watch_alone', effects: [rel('family', -4), status('confidence', 2)] },
      {
        id: 'invite_the_team',
        requires: { relations: { teammates: [65, 100] } },
        effects: [rel('family', 5), rel('teammates', 4), status('money', -600)],
      },
    ],
  },

  // ---------------------------------------------------------------- agents

  {
    id: 'agency_runner',
    category: 'agent',
    when: { stages: ['college'], hasAgent: false, status: { reputation: [30, 100] } },
    weight: 2,
    once: true,
    choices: [
      {
        id: 'go_to_dinner',
        effects: [status('confidence', 1), later('runner_exposed', [4, 14], 0.3)],
      },
      { id: 'tell_compliance', effects: [status('coachTrust', 3)] },
      { id: 'ignore_him', effects: [] },
    ],
  },
  {
    id: 'marketing_plan',
    category: 'agent',
    when: { stages: ['prospect'], hasAgent: true },
    weight: 3,
    once: true,
    cast: ['agent'],
    choices: [
      {
        id: 'brand_first',
        effects: [status('reputation', 3), status('money', 1000), status('energy', -5)],
      },
      { id: 'basketball_first', effects: [stock(0.15), status('energy', -2)] },
      { id: 'trust_the_agent', effects: [rel('agent', 6)] },
    ],
  },
  {
    id: 'promise_call',
    category: 'agent',
    when: { stages: ['prospect'], hasAgent: true, projectedPick: [8, 45] },
    weight: 3,
    once: true,
    cast: ['agent'],
    choices: [
      {
        id: 'trust_the_promise',
        effects: [status('energy', 6), later('promise_broken', [1, 4], 0.45)],
      },
      { id: 'keep_working_out', effects: [status('energy', -6), stock(0.15)] },
      { id: 'ask_for_proof', effects: [rel('agent', -3), stock(0.05)] },
    ],
  },

  // ---------------------------------------------------------------- campus and recruiting

  {
    id: 'parking_tickets',
    category: 'campus',
    when: { stages: ['college'] },
    weight: 2,
    cooldownWeeks: 40,
    choices: [
      { id: 'pay_them', effects: [status('money', -240)] },
      {
        id: 'appeal',
        effects: [status('energy', -1), chance(0.4, [], [status('money', -300)])],
      },
      { id: 'ignore_them', effects: [later('parking_boot', [2, 6], 0.6)] },
    ],
  },
  {
    id: 'host_recruit',
    category: 'recruiting',
    when: { stages: ['college'], phases: ['preseason', 'nonConference'] },
    weight: 2,
    cooldownWeeks: 30,
    cast: ['coach'],
    choices: [
      { id: 'honest_tour', effects: [status('coachTrust', 2), status('chemistry', 1)] },
      {
        id: 'sell_it_hard',
        effects: [status('coachTrust', 2), later('recruit_commits', [3, 10], 0.5)],
      },
      {
        id: 'take_him_out',
        effects: [
          flag('went_to_party'),
          status('chemistry', 2),
          status('energy', -4),
          later('coach_finds_out', [1, 2], 0.3),
        ],
      },
      {
        id: 'dawn_workout',
        requires: { traitsAny: ['gym_rat'] },
        effects: [status('coachTrust', 4), status('energy', -3)],
      },
    ],
  },
];
