import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { translatorFor } from '@/i18n';

const t = translatorFor('en');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return files(p);
    return /\.tsx?$/.test(p) && !p.endsWith('.test.ts') ? [p] : [];
  });
}

describe('interface text', () => {
  it('has every literal ui.* key the screens use', () => {
    const root = join(__dirname, '..', '..');
    const sources = [
      ...files(join(root, 'src', 'features')),
      ...files(join(root, 'src', 'ui')),
      ...files(join(root, 'app')),
    ];
    const missing: string[] = [];
    for (const file of sources) {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/\btt?\(\s*'(ui\.[a-zA-Z0-9_.]+)'/g)) {
        const key = m[1] ?? '';
        if (!t.has(key)) missing.push(`${key} (${file.split('/beforethebuzzer/')[1] ?? file})`);
      }
    }
    expect(missing).toEqual([]);
  });
});
