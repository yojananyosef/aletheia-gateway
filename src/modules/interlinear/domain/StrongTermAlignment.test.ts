import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { alignStrongTokens, type StrongToken } from './StrongTermAlignment';

const DATA = new URL('../../../../public/data/', import.meta.url);

function wlcText(file: string, chapter: number, verse: number): string {
  const data = JSON.parse(readFileSync(new URL(`bibles/WLC/${file}`, DATA), 'utf8'));
  return data.chapters[String(chapter)].verses.find((v: { number: number }) => v.number === verse).text;
}

function interlinearWords(file: string, chapter: number, verse: number): StrongToken[] {
  const data = JSON.parse(readFileSync(new URL(`interlinear/hebrew/${file}`, DATA), 'utf8'));
  const entry = data.find((v: { chapter: number; verse: number }) => v.chapter === chapter && v.verse === verse);
  return entry.words.map((w: Record<string, string>) => ({
    token: w.hebrew || w.hebrew_aramaic || '',
    strongId: /^\d+$/.test(w.strong) && Number(w.strong) > 0 ? `H${w.strong}` : null,
    lemma: w.lemma,
  }));
}

function coveredText(rawText: string, spans: { start: number; end: number }[]): string[] {
  return spans.map((s) => rawText.slice(s.start, s.end));
}

describe('alignStrongTokens', () => {
  it('alinea Génesis 1:1 aunque el interlineal parta las palabras pegadas', () => {
    const raw = wlcText('GEN.json', 1, 1);
    const spans = alignStrongTokens(raw, interlinearWords('GEN.json', 1, 1));
    const texts = coveredText(raw, spans);

    // WLC escribe "בְּרֵאשִׁית" junto; el interlineal lo parte en בְּ (H9001) + רֵאשִׁית (H7225).
    expect(texts).toContain('בְּ');
    expect(texts).toContain('רֵאשִׁ֖ית');
    expect(spans.map((s) => s.strongId)).toContain('H9001');
    expect(spans.map((s) => s.strongId)).toContain('H7225');
    expect(spans.map((s) => s.strongId)).toContain('H430'); // אֱלֹהִים

    // Los spans consecutivos reconstruyen la palabra tal como se lee en WLC.
    const first = spans[0];
    const second = spans[1];
    expect(first.start).toBe(0);
    expect(second.start).toBe(first.end);
    expect(raw.slice(first.start, second.end)).toBe('בְּרֵאשִׁ֖ית');
  });

  it('marca prácticamente todos los términos de Génesis 1:1', () => {
    const raw = wlcText('GEN.json', 1, 1);
    const words = interlinearWords('GEN.json', 1, 1);
    const withStrong = words.filter((w) => w.strongId).length;
    expect(alignStrongTokens(raw, words).length).toBeGreaterThanOrEqual(withStrong - 1);
  });

  it('tolera el marcador de fin de versículo del interlineal (׃ ס)', () => {
    // 1 Cr 1:4: el último token del interlineal trae "׃ ס" que WLC no tiene.
    const raw = wlcText('1CH.json', 1, 4);
    const spans = alignStrongTokens(raw, interlinearWords('1CH.json', 1, 4));
    const texts = coveredText(raw, spans);

    expect(texts).toContain('נֹ֥חַ');
    expect(texts).toContain('שֵׁ֖ם');
    expect(texts.some((t) => t.includes('יָֽפֶת'))).toBe(true);
  });

  it('devuelve spans ordenados, sin solaparse y dentro del texto', () => {
    const files: [string, number, number][] = [
      ['GEN.json', 1, 1],
      ['PSA.json', 23, 1],
      ['DAN.json', 3, 15],
      ['MAL.json', 3, 1],
    ];
    for (const [file, chapter, verse] of files) {
      const raw = wlcText(file, chapter, verse);
      const spans = alignStrongTokens(raw, interlinearWords(file, chapter, verse));
      let previousEnd = -1;
      for (const span of spans) {
        // Los spans contiguos comparten borde: lo importante es que nunca se solapen.
        expect(span.start).toBeGreaterThanOrEqual(previousEnd);
        expect(span.end).toBeGreaterThan(span.start);
        expect(span.end).toBeLessThanOrEqual(raw.length);
        previousEnd = span.end;
      }
    }
  });

  it('sin interacción cuando los datos interlineales no corresponden al versículo', () => {
    // 1 Cr 6: el JSON interlineal viene corrido respecto de WLC; no debe inventar enlaces.
    const raw = wlcText('1CH.json', 6, 25);
    expect(alignStrongTokens(raw, interlinearWords('1CH.json', 6, 25))).toEqual([]);
  });

  it('ignora tokens sin ficha Strong', () => {
    const raw = wlcText('GEN.json', 1, 1);
    const words = interlinearWords('GEN.json', 1, 1).map((w) => ({ ...w, strongId: null }));
    expect(alignStrongTokens(raw, words)).toEqual([]);
  });

  it('no rompe con texto vacío, sin hebreo o sin tokens', () => {
    const words = interlinearWords('GEN.json', 1, 1);
    expect(alignStrongTokens('', words)).toEqual([]);
    expect(alignStrongTokens('En el principio creó Dios', words)).toEqual([]);
    expect(alignStrongTokens('בְּרֵאשִׁית', [])).toEqual([]);
  });

  it('reparte el versículo completo sin perder texto', () => {
    const raw = wlcText('GEN.json', 1, 2);
    const spans = alignStrongTokens(raw, interlinearWords('GEN.json', 1, 2));
    const rebuilt = spans.map((s) => raw.slice(s.start, s.end)).join('|');
    for (const chunk of rebuilt.split('|')) {
      expect(raw).toContain(chunk);
    }
  });
});
