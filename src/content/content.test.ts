import { describe, expect, it } from 'vitest';

import { foldName, indexContent } from '@/engine/content/registry';
import { isPlayer } from '@/engine/model/person';
import { createWorld } from '@/engine/world/create';

import { content } from '.';
import { validateContent } from './validate';

describe('content', () => {
  it('validates with no problems', () => {
    expect(validateContent(content)).toEqual([]);
  });

  it('has enough for a varied world', () => {
    expect(content.nations.length).toBeGreaterThanOrEqual(45);
    expect(content.colleges).toHaveLength(160);
    expect(content.proTeams).toHaveLength(30);
    expect(content.conferences).toHaveLength(12);
    expect(content.traits.filter((t) => t.kind === 'gift').length).toBeGreaterThanOrEqual(6);
    expect(content.traits.filter((t) => t.kind === 'flaw').length).toBeGreaterThanOrEqual(6);
  });

  it('never generates the name of a real player', () => {
    const index = indexContent(content);
    const world = createWorld(index, 'names', { year: 2030, week: 14 });
    const real = index.realNames;
    const clashes = Object.values(world.people)
      .filter(isPlayer)
      .map((p) => `${p.given} ${p.family}`)
      .filter((name) => real.has(foldName(name)));
    expect(clashes).toEqual([]);
  });
});
