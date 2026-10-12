import { content } from '@/content';
import type { CreationInput } from '@/engine/career/create';
import type { Portrait } from '@/engine/model/person';
import { POSITION_HEIGHT, type PlayStyle, type Position } from '@/engine/model/skills';
import { PORTRAIT_PARTS } from '@/engine/world/portrait';

/** The creation form while it is being filled in. */
export interface CreationDraft {
  given: string;
  family: string;
  nation: string;
  hometown: string;
  heightCm: number;
  position: Position;
  style: PlayStyle;
  jersey: string;
  portrait: Portrait;
  gift: string;
  flaw: string;
}

export const STYLE_FOR: Record<Position, PlayStyle> = {
  PG: 'playmaker',
  SG: 'shooter',
  SF: 'slasher',
  PF: 'defender',
  C: 'bigMan',
};

const consequenceTraits = new Set(
  content.consequences.flatMap((c) => c.effects.flatMap((e) => (e.kind === 'trait' ? [e.id] : []))),
);

export const GIFTS = content.traits.filter((t) => t.kind === 'gift');
export const FLAWS = content.traits.filter(
  (t) => t.kind === 'flaw' && !t.unlock && !consequenceTraits.has(t.id),
);

const pick = <T>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)] as T;

export function randomPortrait(): Portrait {
  const r = (n: number) => Math.floor(Math.random() * n);
  return {
    head: r(PORTRAIT_PARTS.head),
    skin: r(PORTRAIT_PARTS.skin),
    eyes: r(PORTRAIT_PARTS.eyes),
    brows: r(PORTRAIT_PARTS.brows),
    nose: r(PORTRAIT_PARTS.nose),
    mouth: r(PORTRAIT_PARTS.mouth),
    hair: r(PORTRAIT_PARTS.hair),
    hairColour: Math.random() < 0.6 ? 0 : r(PORTRAIT_PARTS.hairColour),
    facialHair: Math.random() < 0.55 ? 0 : r(PORTRAIT_PARTS.facialHair),
    accessory: Math.random() < 0.75 ? 0 : r(PORTRAIT_PARTS.accessory),
  };
}

export function defaultDraft(): CreationDraft {
  const nation = content.nations.find((n) => n.code === 'USA') ?? content.nations[0];
  const position = pick(['PG', 'SG', 'SF', 'PF', 'C'] as const);
  return {
    given: '',
    family: '',
    nation: nation?.code ?? 'USA',
    hometown: nation?.cities[0] ?? '',
    heightCm: POSITION_HEIGHT[position],
    position,
    style: STYLE_FOR[position],
    jersey: String(pick([0, 1, 2, 3, 4, 5, 7, 10, 11, 12, 13, 15, 20, 21, 22, 23, 24, 30, 32, 33])),
    portrait: randomPortrait(),
    gift: GIFTS[0]?.id ?? '',
    flaw: FLAWS[0]?.id ?? '',
  };
}

export type DraftErrors = Partial<Record<'given' | 'family' | 'jersey', string>>;

export function validate(d: CreationDraft): DraftErrors {
  const e: DraftErrors = {};
  if (!d.given.trim()) e.given = 'ui.create.errors.given';
  else if (d.given.trim().length > 20) e.given = 'ui.create.errors.tooLong';
  if (!d.family.trim()) e.family = 'ui.create.errors.family';
  else if (d.family.trim().length > 20) e.family = 'ui.create.errors.tooLong';
  const j = Number(d.jersey);
  if (!/^\d{1,2}$/.test(d.jersey) || j < 0 || j > 99) e.jersey = 'ui.create.errors.jersey';
  return e;
}

export function toInput(d: CreationDraft): CreationInput {
  return {
    given: d.given.trim(),
    family: d.family.trim(),
    nation: d.nation,
    hometown: d.hometown,
    heightCm: d.heightCm,
    position: d.position,
    style: d.style,
    jersey: Number(d.jersey),
    portrait: d.portrait,
    gift: d.gift,
    flaw: d.flaw,
    seed: Math.random().toString(36).slice(2, 10),
    startYear: new Date().getFullYear(),
  };
}

export function formatHeight(cm: number): string {
  const inches = Math.round(cm / 2.54);
  return `${cm} cm · ${Math.floor(inches / 12)}′${inches % 12}″`;
}
