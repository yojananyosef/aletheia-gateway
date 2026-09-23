import { describe, expect, it } from 'vitest';
import { applyFontClass, applyThemeClass, applyCalmOverlay, applyReadingClass, FONT_BODY_MAP, persistCalmMode } from './appearance';

describe('appearance', () => {
  it('exposes the five font stacks', () => {
    expect(Object.keys(FONT_BODY_MAP).sort()).toEqual(['inter', 'lexend', 'mono', 'opendyslexic', 'syne']);
  });

  it('is a noop without DOM/storage (node/ssr)', () => {
    expect(() => applyThemeClass('calm')).not.toThrow();
    expect(() => applyThemeClass('standard', { calm: true })).not.toThrow();
    expect(() => applyThemeClass('sepia')).not.toThrow();
    expect(() => applyThemeClass('oled')).not.toThrow();
    expect(() => applyThemeClass('dark')).not.toThrow();
    expect(() => applyThemeClass('high-contrast')).not.toThrow();
    expect(() => applyCalmOverlay(true)).not.toThrow();
    expect(() => applyFontClass('inter')).not.toThrow();
    expect(() => applyFontClass('opendyslexic')).not.toThrow();
    expect(() => applyReadingClass({ bionic: 'leve', ruler: true, redLetters: true })).not.toThrow();
    expect(() => persistCalmMode(true)).not.toThrow();
  });
});
