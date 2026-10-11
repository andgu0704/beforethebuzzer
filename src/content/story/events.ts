import type { EventDef } from '@/engine/content/story-types';

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
];
