// Fails if the God Mode sentinel string is in a release web bundle (built without EXPO_PUBLIC_GOD_MODE).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] ?? 'dist';
const sentinel = 'GODMODE-SENTINEL-7f3a91';
const files = [];
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js')) files.push(p);
  }
};
walk(root);
const hits = files.filter((f) => readFileSync(f, 'utf8').includes(sentinel));
if (hits.length) {
  console.error(`God Mode code found in the release bundle: ${hits.join(', ')}`);
  process.exit(1);
}
console.log(`God Mode absent from ${files.length} bundle file(s).`);
