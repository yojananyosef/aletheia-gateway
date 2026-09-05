import { describe, expect, it } from 'vitest';
import { readStorageWithLegacy, removeStorageWithLegacy } from './storage';

describe('readStorageWithLegacy', () => {
  it('returns null without localStorage (node/ssr)', () => {
    expect(readStorageWithLegacy('aletheia_x', 'alethia_x')).toBeNull();
  });

  it('remove is a noop without localStorage', () => {
    expect(() => removeStorageWithLegacy('aletheia_x', 'alethia_x')).not.toThrow();
  });
});
