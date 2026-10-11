/**
 * Save migrations. Each entry upgrades a document from format N to N+1. A save is always
 * migrated step by step to the current format before it is validated and loaded.
 */

export type Migration = (document: unknown) => unknown;

/** Keyed by the format being upgraded from. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

export class SaveTooNewError extends Error {
  constructor(
    readonly found: number,
    readonly supported: number,
  ) {
    super(`save format ${found} is newer than this app supports (${supported})`);
  }
}

export function migrate(
  document: unknown,
  from: number,
  to: number,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
): unknown {
  if (from > to) throw new SaveTooNewError(from, to);
  let doc = document;
  for (let v = from; v < to; v++) {
    const step = migrations[v];
    if (!step) throw new Error(`no migration from save format ${v}`);
    doc = step(doc);
  }
  return doc;
}
