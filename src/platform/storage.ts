/** Saves and settings on devices: SQLite (WAL) for saves, its key-value store for settings. */

import * as SQLite from 'expo-sqlite';
import { Storage } from 'expo-sqlite/kv-store';

import type { SaveStore, SaveSummary } from '@/engine/save/store';

let db: Promise<SQLite.SQLiteDatabase> | null = null;

function open(): Promise<SQLite.SQLiteDatabase> {
  db ??= (async () => {
    const d = await SQLite.openDatabaseAsync('careers.db');
    await d.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS saves (
        id TEXT PRIMARY KEY NOT NULL,
        summary TEXT NOT NULL,
        body TEXT NOT NULL,
        backup TEXT
      );
    `);
    return d;
  })();
  return db;
}

interface Row {
  summary: string;
  body: string;
  backup: string | null;
}

export const saveStore: SaveStore = {
  async list() {
    const d = await open();
    const rows = await d.getAllAsync<{ summary: string }>('SELECT summary FROM saves');
    return rows.map((r) => JSON.parse(r.summary) as SaveSummary);
  },
  async read(id) {
    const d = await open();
    const row = await d.getFirstAsync<Row>('SELECT body FROM saves WHERE id = ?', id);
    return row?.body ?? null;
  },
  async write(summary, text) {
    const d = await open();
    await d.withTransactionAsync(async () => {
      await d.runAsync(
        `INSERT INTO saves (id, summary, body, backup) VALUES (?, ?, ?, NULL)
         ON CONFLICT(id) DO UPDATE SET backup = saves.body, body = excluded.body, summary = excluded.summary`,
        summary.id,
        JSON.stringify(summary),
        text,
      );
    });
  },
  async readBackup(id) {
    const d = await open();
    const row = await d.getFirstAsync<Row>('SELECT backup FROM saves WHERE id = ?', id);
    return row?.backup ?? null;
  },
  async remove(id) {
    const d = await open();
    await d.runAsync('DELETE FROM saves WHERE id = ?', id);
  },
};

export const kv = {
  get(key: string): string | null {
    return Storage.getItemSync(key);
  },
  set(key: string, value: string): void {
    Storage.setItemSync(key, value);
  },
};
