/**
 * Shapes of the static world content the engine consumes. The engine defines these;
 * `src/content` provides the data and validates it.
 */

export type Continent = 'americas' | 'europe' | 'asiaPacific' | 'africa';

/** ISO 3166-1 alpha-3 style code, e.g. "SRB". */
export type NationCode = string;

export interface WeightedRef {
  readonly id: string;
  readonly weight: number;
}

export interface NamingCultureDef {
  readonly id: string;
  /** Given names, most common first. */
  readonly given: readonly string[];
  /** Family names, most common first. */
  readonly family: readonly string[];
}

export interface ColourPair {
  /** "#RRGGBB" */
  readonly primary: string;
  readonly secondary: string;
}

export interface NationDef {
  readonly code: NationCode;
  readonly continent: Continent;
  /**
   * Basketball strength, 0–100. Drives how good the nation's player pool is and how hard
   * its national team is to make. Roughly: 95 United States, 85 Serbia, 50 Georgia, 20 Iceland.
   */
  readonly strength: number;
  /** Relative share of generated players (college recruits, overseas pros) from this nation. */
  readonly talentShare: number;
  readonly naming: readonly WeightedRef[];
  /** Real cities, largest or most basketball-relevant first. At least eight. */
  readonly cities: readonly string[];
  readonly colours: ColourPair;
  /** Invented overseas club names in this nation's cities, e.g. "Dunav Novi Sad". */
  readonly clubs: readonly string[];
}

export type ConferenceTier = 'major' | 'mid' | 'low';

export interface ConferenceDef {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly tier: ConferenceTier;
}

export interface CollegeDef {
  readonly id: string;
  /** Institution name, e.g. "Halcyon State". */
  readonly name: string;
  /** Team nickname, e.g. "Herons". */
  readonly nickname: string;
  /** Three or four capital letters, e.g. "HSU". */
  readonly abbr: string;
  readonly city: string;
  /** US state or Canadian province code, e.g. "GA". */
  readonly region: string;
  readonly conferenceId: string;
  /** Programme prestige 1–100 (recruiting pull, budget, exposure). */
  readonly prestige: number;
  /** Academic demand 1–100. */
  readonly academics: number;
  readonly colours: ColourPair;
}

export type ProConference = 'east' | 'west';

export type EmblemId =
  | 'comet'
  | 'peak'
  | 'wave'
  | 'crown'
  | 'anchor'
  | 'wing'
  | 'star'
  | 'bolt'
  | 'flame'
  | 'gear'
  | 'oak'
  | 'bridge'
  | 'compass'
  | 'arrow'
  | 'shield'
  | 'sun'
  | 'moon'
  | 'horn'
  | 'claw'
  | 'feather'
  | 'tower'
  | 'river'
  | 'spark'
  | 'key'
  | 'hammer'
  | 'sail'
  | 'pine'
  | 'mesa'
  | 'orbit'
  | 'lantern';

export interface ProTeamDef {
  readonly id: string;
  readonly city: string;
  readonly nickname: string;
  readonly abbr: string;
  readonly conference: ProConference;
  readonly division: string;
  /** Market size 1–100 (affects nothing in v1 but is kept for contracts and fame later). */
  readonly market: number;
  readonly colours: ColourPair;
  readonly emblem: EmblemId;
}

export interface DenyLists {
  /** Full names of real basketball players, "Given Family", case-insensitive. */
  readonly players: readonly string[];
  /** Real professional team nicknames, e.g. "Lakers". */
  readonly proNicknames: readonly string[];
  /** Real professional team full names, e.g. "Seattle SuperSonics". */
  readonly proTeams: readonly string[];
  /** Real college/university names as used in athletics, e.g. "Gonzaga", "Kent State". */
  readonly colleges: readonly string[];
}
