/**
 * Save encoding. Players are most of a world (thousands of records with the same forty
 * fields), so each one is packed into a positional array; everything else is plain JSON.
 * The layout belongs to a save format version: changing it means a new version and a
 * migration (see migrations.ts).
 */

import type { PersonId, TeamId } from '../core/ids';
import type { Affiliation, Injury, Person, Player, SeasonLine, Stint } from '../model/person';
import { PLAY_STYLES, POSITIONS, SKILLS, type Skills } from '../model/skills';
import type { World } from '../model/world';
import type { GameState } from '../career/state';

type Packed = readonly unknown[];

const PORTRAIT_KEYS = [
  'head',
  'skin',
  'eyes',
  'brows',
  'nose',
  'mouth',
  'hair',
  'hairColour',
  'facialHair',
  'accessory',
] as const;
const LINE_KEYS = [
  'gp',
  'gs',
  'min',
  'pts',
  'fgm',
  'fga',
  'tpm',
  'tpa',
  'ftm',
  'fta',
  'orb',
  'drb',
  'ast',
  'stl',
  'blk',
  'tov',
  'pf',
] as const;

const packSkills = (s: Skills) => SKILLS.map((k) => s[k]);
function unpackSkills(a: readonly number[]): Skills {
  const out = {} as Skills;
  SKILLS.forEach((k, i) => (out[k] = a[i] ?? 0));
  return out;
}

function packLine(l: SeasonLine): Packed {
  return [l.season, l.team, l.league, l.competition ?? 0, ...LINE_KEYS.map((k) => l[k])];
}

function unpackLine(a: Packed): SeasonLine {
  const [season, team, league, competition, ...rest] = a as [
    number,
    string,
    SeasonLine['league'],
    string | 0,
    ...number[],
  ];
  const line = { season, team, league, ...(competition ? { competition } : {}) } as SeasonLine &
    Record<string, number>;
  LINE_KEYS.forEach((k, i) => ((line as Record<string, unknown>)[k] = rest[i] ?? 0));
  return line;
}

export function packPlayer(p: Player): Packed {
  return [
    p.id,
    p.given,
    p.family,
    p.nation,
    p.hometown,
    p.birthYear,
    PORTRAIT_KEYS.map((k) => p.portrait[k]),
    p.heightCm,
    p.wingspanCm,
    p.weightKg,
    POSITIONS.indexOf(p.position),
    PLAY_STYLES.indexOf(p.style),
    packSkills(p.skills),
    packSkills(p.ceiling),
    p.growthRate,
    p.traits,
    p.health,
    p.energy,
    p.confidence,
    p.injury,
    p.chronic,
    p.jersey,
    p.affiliation,
    p.stints.map((s) => [s.team, s.league, s.fromSeason, s.toSeason]),
    p.lines.map(packLine),
    p.draft,
    p.recruitRank,
    p.isUser ? 1 : 0,
  ];
}

export function unpackPlayer(a: Packed): Player {
  const portrait = {} as Record<(typeof PORTRAIT_KEYS)[number], number>;
  PORTRAIT_KEYS.forEach((k, i) => (portrait[k] = (a[6] as number[])[i] ?? 0));
  return {
    id: a[0] as PersonId,
    kind: 'player',
    given: a[1] as string,
    family: a[2] as string,
    nation: a[3] as string,
    hometown: a[4] as string,
    birthYear: a[5] as number,
    portrait: portrait,
    heightCm: a[7] as number,
    wingspanCm: a[8] as number,
    weightKg: a[9] as number,
    position: POSITIONS[a[10] as number] ?? 'SF',
    style: PLAY_STYLES[a[11] as number] ?? 'slasher',
    skills: unpackSkills(a[12] as number[]),
    ceiling: unpackSkills(a[13] as number[]),
    growthRate: a[14] as number,
    traits: a[15] as string[],
    health: a[16] as number,
    energy: a[17] as number,
    confidence: a[18] as number,
    injury: a[19] as Injury | null,
    chronic: a[20] as string[],
    jersey: a[21] as number,
    affiliation: a[22] as Affiliation,
    stints: (a[23] as [TeamId | string, Stint['league'], number, number | null][]).map(
      ([team, league, fromSeason, toSeason]) => ({ team, league, fromSeason, toSeason }),
    ),
    lines: (a[24] as Packed[]).map(unpackLine),
    draft: a[25] as Player['draft'],
    recruitRank: a[26] as number | null,
    isUser: a[27] === 1,
  };
}

interface SaveDocument {
  readonly format: number;
  readonly state: Omit<GameState, 'world'> & {
    readonly world: Omit<World, 'people'> & {
      readonly players: Packed[];
      readonly others: Person[];
    };
  };
}

export function encodeState(state: GameState): string {
  const players: Packed[] = [];
  const others: Person[] = [];
  const { people, ...world } = state.world;
  for (const p of Object.values(people)) {
    if (p.kind === 'player') players.push(packPlayer(p));
    else others.push(p);
  }
  const doc: SaveDocument = {
    format: state.format,
    state: { ...state, world: { ...world, players, others } },
  };
  return JSON.stringify(doc);
}

/** Reads the raw document and its format version; migration and validation come after. */
export function decodeDocument(text: string): { format: number; document: unknown } {
  const parsed = JSON.parse(text) as { format?: unknown };
  return { format: typeof parsed.format === 'number' ? parsed.format : 0, document: parsed };
}

/** Rebuilds a state from a document already at the current format. */
export function documentToState(document: unknown): GameState {
  const doc = document as SaveDocument;
  const { players, others, ...world } = doc.state.world;
  const people: Record<string, Person> = {};
  for (const packed of players) {
    const p = unpackPlayer(packed);
    people[p.id] = p;
  }
  for (const o of others) people[o.id] = o;
  return { ...doc.state, world: { ...world, people } };
}
