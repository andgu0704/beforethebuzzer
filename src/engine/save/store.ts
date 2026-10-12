import { SAVE_FORMAT, type GameState } from '../career/state';
import type { Portrait } from '../model/person';
import { decodeDocument, documentToState, encodeState } from './codec';
import { migrate } from './migrations';
import { saveSchema } from './validate';

/** One saved career as the saves list shows it. */
export interface SaveSummary {
  readonly id: string;
  readonly name: string;
  readonly updatedWeek: number;
  readonly godMode: boolean;
  /** What the saves list shows: portrait, team, date. Absent on saves written by scripts. */
  readonly detail?: SaveDetail;
}

export interface SaveDetail {
  readonly year: number;
  readonly week: number;
  readonly stage: string;
  readonly teamId: string;
  readonly teamName: string;
  readonly colour: string;
  readonly jersey: number;
  readonly portrait: Portrait;
  readonly ended: boolean;
  readonly pick: number;
}

/** Storage for saves. The app uses SQLite on devices and IndexedDB on the web; tests use memory. */
export interface SaveStore {
  list(): Promise<SaveSummary[]>;
  read(id: string): Promise<string | null>;
  /** Writes the save and keeps the previous version as a backup. */
  write(summary: SaveSummary, text: string): Promise<void>;
  readBackup(id: string): Promise<string | null>;
  remove(id: string): Promise<void>;
}

export class SaveError extends Error {
  constructor(
    readonly reason: 'corrupt' | 'tooNew' | 'invalid',
    message: string,
  ) {
    super(message);
  }
}

export function serialise(state: GameState): string {
  return encodeState(state);
}

/** Parses, migrates and validates a save; throws a SaveError the UI can explain. */
export function deserialise(text: string): GameState {
  let parsed: { format: number; document: unknown };
  try {
    parsed = decodeDocument(text);
  } catch {
    throw new SaveError('corrupt', 'the save is not readable');
  }
  if (parsed.format > SAVE_FORMAT)
    throw new SaveError('tooNew', `save format ${parsed.format} is newer than ${SAVE_FORMAT}`);
  const migrated = migrate(parsed.document, parsed.format, SAVE_FORMAT);
  const check = saveSchema.safeParse(migrated);
  if (!check.success)
    throw new SaveError(
      'invalid',
      check.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; '),
    );
  return documentToState(migrated);
}

export class MemorySaveStore implements SaveStore {
  private readonly saves = new Map<
    string,
    { summary: SaveSummary; text: string; backup: string | null }
  >();

  list(): Promise<SaveSummary[]> {
    return Promise.resolve([...this.saves.values()].map((s) => s.summary));
  }

  read(id: string): Promise<string | null> {
    return Promise.resolve(this.saves.get(id)?.text ?? null);
  }

  write(summary: SaveSummary, text: string): Promise<void> {
    const previous = this.saves.get(summary.id);
    this.saves.set(summary.id, { summary, text, backup: previous?.text ?? null });
    return Promise.resolve();
  }

  readBackup(id: string): Promise<string | null> {
    return Promise.resolve(this.saves.get(id)?.backup ?? null);
  }

  remove(id: string): Promise<void> {
    this.saves.delete(id);
    return Promise.resolve();
  }
}
