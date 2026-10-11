import { describe, expect, it } from 'vitest';

import { colleges } from '@/content/world/colleges';
import { proTeams } from '@/content/world/pro-teams';

import { brandAccent, deriveAccent } from './accent';
import { contrast } from './colour';
import { palette } from './tokens';

describe('team accents', () => {
  const teams = [...colleges, ...proTeams];
  for (const scheme of ['light', 'dark'] as const) {
    it(`meet contrast for every team in ${scheme}`, () => {
      for (const team of teams) {
        const a = deriveAccent(team.colours.primary, scheme);
        expect(contrast(a.onAccent, a.accent), `${team.id} onAccent`).toBeGreaterThanOrEqual(4.5);
        expect(
          contrast(a.accentText, palette[scheme].canvas),
          `${team.id} accentText`,
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrast(a.accentText, palette[scheme].surface),
          `${team.id} accentText on surface`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
    it(`brand accent works in ${scheme}`, () => {
      const a = brandAccent(scheme);
      expect(contrast(a.onAccent, a.accent)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(a.accentText, palette[scheme].canvas)).toBeGreaterThanOrEqual(4.5);
    });
  }
});
