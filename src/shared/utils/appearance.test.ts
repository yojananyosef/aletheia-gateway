import { describe, expect, it } from 'vitest';
import { applyFontClass, applyThemeClass, FONT_BODY_MAP, persistCalmMode } from './appearance';

describe('appearance', () => {
  it('exposes the four font stacks', () => {
    expect(Object.keys(FONT_BODY_MAP).sort()).toEqual(['inter', 'lexend', 'mono', 'syne']);
  });

  it('is a noop without DOM/storage (node/ssr)', () => {
    expect(() => applyThemeClass('calm')).not.toThrow();
    expect(() => applyFontClass('inter')).not.toThrow();
    expect(() => persistCalmMode(true)).not.toThrow();
  });
});
