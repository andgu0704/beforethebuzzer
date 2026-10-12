import type { ConsequenceDef } from '@/engine/content/story-types';

import { injury, rel, status, stock, suspension } from './effects';

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
  {
    id: 'feud_reignites',
    when: { stages: ['college'], flagsAll: ['feud_with_rival'] },
    effects: [status('reputation', 1), status('confidence', 1)],
    event: 'rival_rematch_hype',
  },
  {
    id: 'flip_rumour',
    when: { stages: ['college'] },
    effects: [status('coachTrust', -3)],
  },
  {
    id: 'coach_survives',
    when: { stages: ['college'] },
    effects: [status('coachTrust', 4)],
  },
  {
    id: 'freshman_pays_back',
    when: { stages: ['college'] },
    effects: [status('chemistry', 4), rel('teammates', 5)],
  },
  {
    id: 'academic_warning',
    when: { stages: ['college'] },
    effects: [status('gpa', -0.15), status('coachTrust', -2), status('confidence', -1)],
  },
  {
    id: 'favouritism_story',
    when: { stages: ['college'] },
    effects: [status('reputation', -3), status('gpa', -0.1)],
  },
  {
    id: 'documentary_edit',
    effects: [status('reputation', -3), status('chemistry', -2)],
  },
  {
    id: 'unflattering_story',
    effects: [status('reputation', -3), status('confidence', -2)],
  },
  {
    id: 'loan_repaid',
    effects: [status('money', 400), rel('teammates', 3)],
  },
  {
    id: 'coin_collapse',
    effects: [status('reputation', -5), rel('fans', -8)],
  },
  {
    id: 'concussion_returns',
    when: { injured: false },
    effects: [injury('concussion', [3, 4]), status('health', -5)],
  },
  {
    id: 'medical_rumour',
    when: { stages: ['prospect'] },
    effects: [stock(-0.3)],
  },
  {
    id: 'promise_broken',
    when: { stages: ['prospect'] },
    effects: [stock(-0.4), rel('agent', -6), status('confidence', -3)],
  },
  {
    id: 'runner_exposed',
    when: { stages: ['college', 'prospect'] },
    effects: [suspension(2), status('reputation', -4), status('coachTrust', -4)],
  },
  {
    id: 'parking_boot',
    effects: [status('money', -350)],
  },
  {
    id: 'recruit_commits',
    when: { stages: ['college'] },
    effects: [status('coachTrust', 4), status('chemistry', 1)],
  },
];
