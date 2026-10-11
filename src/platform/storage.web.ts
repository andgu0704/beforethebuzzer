/** Saves and settings on the web: IndexedDB for saves (they are several MB), localStorage for settings. */

import type { SaveStore, SaveSummary } from '@/engine/save/store';

interface Record_ {
  id: string;
  summary: SaveSummary;
  body: string;
  backup: string | null;
}

let db: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  db ??= new Promise((resolve, reject) => {
    const req = indexedDB.open('before-the-buzzer', 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('saves', { keyPath: 'id' });
    };
    req.onsuccess = () => {
      resolve(req.result);
    };
    req.onerror = () => {
      reject(req.error ?? new Error('IndexedDB failed to open'));
    };
  });
  return db;
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(d.transaction('saves', mode).objectStore('saves'));
        req.onsuccess = () => {
          resolve(req.result);
        };
        req.onerror = () => {
          reject(req.error ?? new Error('IndexedDB request failed'));
        };
      }),
  );
}

export const saveStore: SaveStore = {
  async list() {
    const all = await run<Record_[]>('readonly', (s) => s.getAll() as IDBRequest<Record_[]>);
    return all.map((r) => r.summary);
  },
  async read(id) {
    const r = await run<Record_ | undefined>(
      'readonly',
      (s) => s.get(id) as IDBRequest<Record_ | undefined>,
    );
    return r?.body ?? null;
  },
  async write(summary, text) {
    const prev = await run<Record_ | undefined>(
      'readonly',
      (s) => s.get(summary.id) as IDBRequest<Record_ | undefined>,
    );
    await run('readwrite', (s) =>
      s.put({ id: summary.id, summary, body: text, backup: prev?.body ?? null }),
    );
  },
  async readBackup(id) {
    const r = await run<Record_ | undefined>(
      'readonly',
      (s) => s.get(id) as IDBRequest<Record_ | undefined>,
    );
    return r?.backup ?? null;
  },
  async remove(id) {
    await run('readwrite', (s) => s.delete(id));
  },
};

export const kv = {
  get(key: string): string | null {
    try {
      return globalThis.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      globalThis.localStorage.setItem(key, value);
    } catch {
      // Private browsing can refuse storage; settings then last for the session.
    }
  },
};
