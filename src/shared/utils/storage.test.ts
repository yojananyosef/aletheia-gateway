import { afterEach, describe, expect, it } from 'vitest';
import { readStorageWithLegacy, removeStorageWithLegacy } from './storage';
import { installMemoryStorage, uninstallStorage } from '../../test-utils';

afterEach(() => {
  uninstallStorage();
});

describe('readStorageWithLegacy', () => {
  it('returns null without localStorage (node/ssr)', () => {
    expect(readStorageWithLegacy('aletheia_x', 'alethia_x')).toBeNull();
  });

  it('prefers the canonical key', () => {
    installMemoryStorage({ new_k: 'nuevo', old_k: 'viejo' });
    expect(readStorageWithLegacy('new_k', 'old_k')).toBe('nuevo');
  });

  it('falls back to legacy and promotes it to the canonical key', () => {
    const store = installMemoryStorage({ old_k: 'heredado' });
    expect(readStorageWithLegacy('new_k', 'old_k')).toBe('heredado');
    expect(store.dump()).toEqual({ new_k: 'heredado' });
  });

  it('walks multiple legacy keys in order', () => {
    const store = installMemoryStorage({ orphan_k: 'rescatado' });
    expect(readStorageWithLegacy('new_k', ['missing_k', 'orphan_k'])).toBe('rescatado');
    expect(store.dump()).toEqual({ new_k: 'rescatado' });
  });

  it('returns null when no key exists', () => {
    installMemoryStorage({});
    expect(readStorageWithLegacy('new_k', ['a', 'b'])).toBeNull();
  });
});

describe('removeStorageWithLegacy', () => {
  it('is a noop without localStorage', () => {
    expect(() => removeStorageWithLegacy('aletheia_x', 'alethia_x')).not.toThrow();
  });

  it('removes canonical and all legacy keys', () => {
    const store = installMemoryStorage({ new_k: 'x', old_k: 'y', orphan_k: 'z', other: 'w' });
    removeStorageWithLegacy('new_k', ['old_k', 'orphan_k']);
    expect(store.dump()).toEqual({ other: 'w' });
  });
});
