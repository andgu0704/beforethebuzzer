/**
 * Save migrations. Each entry upgrades a document from format N to N+1. A save is always
 * migrated step by step to the current format before it is validated and loaded.
 */

export type Migration = (document: unknown) => unknown;

interface DocV1 {
  format: number;
  state: {
    format: number;
    career: Record<string, unknown> & {
      stage: string;
      ending: { reason: string } | null;
    };
  };
}

/**
 * 1 → 2: skill points, the pre-game approach and award tracking arrive; a career that ended on
 * draft night carries on into the pros.
 */
function toV2(document: unknown): unknown {
  const doc = structuredCloneish(document) as DocV1;
  const career = doc.state.career;
  career['skillPoints'] ??= 9;
  career['skillPointsEarned'] ??= 9;
  career['approach'] ??= 'team';
  career['awardsSeen'] ??= {};
  if (career.stage === 'drafted' && career.ending?.reason === 'draft') {
    career.stage = 'pro';
    career.ending = null;
  }
  doc.format = 2;
  doc.state.format = 2;
  return doc;
}

function structuredCloneish(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown;
}

/** Keyed by the format being upgraded from. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = { 1: toV2 };

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
