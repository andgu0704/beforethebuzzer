import type { PersonId, TeamId } from '../core/ids';
import type { ColourPair, EmblemId, NationCode, ProConference } from '../content/world-types';

interface TeamBase {
  readonly id: TeamId;
  name: string;
  nickname: string;
  abbr: string;
  readonly city: string;
  readonly colours: ColourPair;
  coachId: PersonId | null;
  roster: PersonId[];
}

export interface CollegeTeam extends TeamBase {
  readonly kind: 'college';
  readonly region: string;
  readonly conferenceId: string;
  /** 1–100. Moves slowly with results. */
  prestige: number;
  readonly academics: number;
}

export type GmTemperament = 'bestAvailable' | 'need' | 'upside' | 'safe';

export interface ProTeam extends TeamBase {
  readonly kind: 'pro';
  readonly conference: ProConference;
  readonly division: string;
  readonly market: number;
  readonly emblem: EmblemId;
  gm: { temperament: GmTemperament; internationalBias: number };
}

export interface NationalTeam extends TeamBase {
  readonly kind: 'national';
  readonly nation: NationCode;
  readonly level: 'senior' | 'u20';
}

/** An invitation-only side, such as a high-school showcase team. */
export interface SelectTeam extends TeamBase {
  readonly kind: 'select';
}

export type Team = CollegeTeam | ProTeam | NationalTeam | SelectTeam;
