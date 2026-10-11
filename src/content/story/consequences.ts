import type { ConsequenceDef } from '@/engine/content/story-types';

export const consequences: readonly ConsequenceDef[] = [
  {
    id: 'chronic_injury',
    effects: [
      { kind: 'trait', id: 'brittle', add: true },
      { kind: 'status', key: 'health', delta: -10 },
    ],
  },
  {
    id: 'coach_finds_out',
    when: { stages: ['college'] },
    effects: [{ kind: 'status', key: 'coachTrust', delta: -2 }],
    event: 'coach_heard_about_party',
  },
  {
    id: 'academic_investigation',
    when: { stages: ['college'] },
    effects: [
      { kind: 'suspension', games: 3 },
      { kind: 'status', key: 'gpa', delta: -0.3 },
      { kind: 'status', key: 'reputation', delta: -4 },
    ],
  },
  {
    id: 'eligibility_scandal',
    when: { stages: ['college', 'prospect'] },
    effects: [
      { kind: 'suspension', games: 6 },
      { kind: 'status', key: 'reputation', delta: -10 },
      { kind: 'draftStock', delta: -1.5 },
      { kind: 'status', key: 'coachTrust', delta: -10 },
    ],
  },
  {
    id: 'locker_room_leak',
    when: { stages: ['college'] },
    effects: [
      { kind: 'status', key: 'chemistry', delta: -6 },
      { kind: 'relation', who: 'teammates', delta: -10 },
    ],
  },
];
