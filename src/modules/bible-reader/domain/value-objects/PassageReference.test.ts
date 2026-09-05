import { describe, expect, it } from 'vitest';
import { PassageReference } from './PassageReference';

describe('PassageReference', () => {
  it('parses a simple reference', () => {
    const ref = new PassageReference('Juan 3:16');
    expect(ref.book).toBe('Juan');
    expect(ref.chapter).toBe(3);
    expect(ref.startVerse).toBe(16);
  });

  it('parses verse ranges', () => {
    const ref = new PassageReference('Génesis 1:1-3');
    expect(ref.startVerse).toBe(1);
    expect(ref.endVerse).toBe(3);
  });

  it('parses discontinuous verses', () => {
    const ref = new PassageReference('Gen 3:1,6');
    expect(ref.book).toBe('Génesis');
    expect(ref.primarySegment.verseNumbers).toContain(1);
    expect(ref.primarySegment.verseNumbers).toContain(6);
  });

  it('parses multiple passages separated by semicolon', () => {
    const ref = new PassageReference('Génesis 1:1; Juan 3:16');
    expect(ref.segments).toHaveLength(2);
    expect(ref.fullFormatted).toContain('Juan 3:16');
  });

  it('inherits book context in composed lists', () => {
    const ref = new PassageReference('Gen 3:1,6; 5');
    expect(ref.segments).toHaveLength(2);
    expect(ref.segments[1].book).toBe('Génesis');
    expect(ref.segments[1].chapter).toBe(5);
  });

  it('detects references vs topics', () => {
    expect(PassageReference.isReference('Salmos 23')).toBe(true);
    expect(PassageReference.isReference('amor fe')).toBe(false);
  });
});
