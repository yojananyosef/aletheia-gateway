/** Stub de localStorage en memoria para tests (entorno node sin DOM). */

export interface MemoryStorageStub {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  dump(): Record<string, string>;
}

export function installMemoryStorage(initial: Record<string, string> = {}): MemoryStorageStub {
  const store = new Map<string, string>(Object.entries(initial));
  const stub: MemoryStorageStub = {
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    dump: () => Object.fromEntries(store),
  };
  (globalThis as unknown as Record<string, unknown>).localStorage = stub;
  return stub;
}

export function uninstallStorage(): void {
  delete (globalThis as unknown as Record<string, unknown>).localStorage;
}
