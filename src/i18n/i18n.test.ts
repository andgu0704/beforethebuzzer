import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { content } from '@/content';
import { CLIP_TEMPLATES } from '@/content/story/clips';
import { INJURY_KINDS } from '@/engine/player/injury';

import { catalogKeys, createTranslator, translatorFor } from '.';
import { en } from './en';

const t = translatorFor('en');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const path = join(dir, f);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith('.ts') && !path.endsWith('.test.ts') ? [path] : [];
  });
}

describe('localisation', () => {
  it('interpolates, pluralises and resolves names', () => {
    const tr = createTranslator('en', {
      a: 'Hi {name}',
      b: { by: 'n', one: '{n} week', other: '{n} weeks' },
    });
    expect(tr.t('a', { name: 'Nika' })).toBe('Hi Nika');
    expect(tr.t('b', { n: 1 })).toBe('1 week');
    expect(tr.t('b', { n: 3 })).toBe('3 weeks');
    const z = createTranslator('en', { c: { by: 'n', zero: 'none', one: 'one', other: '{n}' } });
    expect(z.t('c', { n: 0 })).toBe('none');
    expect(z.t('c', { n: 2 })).toBe('2');
    expect(
      tr.message(
        { key: 'a', params: { name: { person: 'p1' as never } } },
        { person: () => 'Beridze', team: () => '' },
      ),
    ).toBe('Hi Beridze');
  });

  it('works without Intl.PluralRules or Intl.NumberFormat, as on Hermes for iOS', () => {
    const intl = Intl as unknown as Record<string, unknown>;
    const saved = { PluralRules: intl['PluralRules'], NumberFormat: intl['NumberFormat'] };
    intl['PluralRules'] = undefined;
    intl['NumberFormat'] = undefined;
    try {
      const tr = createTranslator('en', {
        b: { by: 'n', one: '{n} week', other: '{n} weeks' },
      });
      expect(tr.t('b', { n: 1 })).toBe('1 week');
      expect(tr.t('b', { n: 0 })).toBe('0 weeks');
      expect(tr.t('b', { n: 12500 })).toBe('12,500 weeks');
      expect(tr.number(1234567)).toBe('1,234,567');
      expect(tr.number(2.5, { maximumFractionDigits: 1 })).toBe('2.5');
    } finally {
      intl['PluralRules'] = saved.PluralRules;
      intl['NumberFormat'] = saved.NumberFormat;
    }
  });

  it('has text for every literal key the engine emits', () => {
    const files = sourceFiles(join(__dirname, '..', 'engine'));
    const missing: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/msg\(\s*'([a-zA-Z0-9_.]+)'/g)) {
        const key = m[1] ?? '';
        if (!t.has(key)) missing.push(`${key} (${file.split('/engine/')[1] ?? file})`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('has text for the engine’s dynamic keys', () => {
    const dynamic = [
      ...[
        'gameWinner',
        'bigGame',
        'badGame',
        'blowoutWin',
        'closeWin',
        'win',
        'blowoutLoss',
        'closeLoss',
        'loss',
        'dnp',
        'missed.injured',
        'missed.suspended',
        'missed.ineligible',
      ].map((h) => `feed.game.${h}`),
      ...['minor', 'moderate', 'major', 'severe'].map((s) => `feed.injury.${s}`),
      ...Object.values(INJURY_KINDS)
        .flat()
        .map((k) => `injuries.${k}`),
      ...CLIP_TEMPLATES.map((c) => `clips.${c}`),
      ...['reach', 'balanced', 'star', 'academic'].map((p) => `offers.pitch.${p}`),
      ...['bench', 'rotation', 'starter', 'star'].map((r) => `roles.${r}`),
    ];
    expect(dynamic.filter((k) => !t.has(k))).toEqual([]);
  });

  it('has text for all content', () => {
    const required: string[] = [];
    for (const tr of content.traits)
      required.push(`traits.${tr.id}.name`, `traits.${tr.id}.description`);
    for (const e of content.events) {
      required.push(`events.${e.id}.title`, `events.${e.id}.body`);
      for (const c of e.choices)
        required.push(
          ...['label', 'outcome', 'timeline'].map((f) => `events.${e.id}.choices.${c.id}.${f}`),
        );
    }
    for (const m of content.moments) {
      required.push(`moments.${m.id}.title`, `moments.${m.id}.body`);
      for (const o of m.options)
        required.push(
          ...['label', 'read', 'success', 'failure'].map(
            (f) => `moments.${m.id}.options.${o.id}.${f}`,
          ),
        );
    }
    for (const s of content.social) required.push(`social.${s.id}`);
    for (const c of content.consequences) required.push(`consequences.${c.id}`);
    for (const n of content.nations) required.push(`nations.${n.code}`);
    expect(required.filter((k) => !t.has(k))).toEqual([]);
  });

  it('has no orphaned content text', () => {
    const ids = {
      traits: new Set(content.traits.map((x) => x.id)),
      events: new Set(content.events.map((x) => x.id)),
      moments: new Set(content.moments.map((x) => x.id)),
      social: new Set(content.social.map((x) => x.id)),
      consequences: new Set(content.consequences.map((x) => x.id)),
    };
    const orphans = catalogKeys(en).filter((key) => {
      const [root, id] = key.split('.');
      const set = ids[root as keyof typeof ids] as Set<string> | undefined;
      return set !== undefined && id !== undefined && !set.has(id);
    });
    expect(orphans).toEqual([]);
  });
});
