import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { InterlinearTestament } from './InterlinearVerse';
import { alignStrongTokens, type StrongToken } from './StrongTermAlignment';

const DATA = new URL('../../../../public/data/', import.meta.url);

function bibleText(version: 'WLC' | 'WHNU', file: string, chapter: number, verse: number): string {
  const data = JSON.parse(readFileSync(new URL(`bibles/${version}/${file}`, DATA), 'utf8'));
  return data.chapters[String(chapter)].verses.find((v: { number: number }) => v.number === verse).text;
}

function interlinearTokens(
  testament: InterlinearTestament,
  file: string,
  chapter: number,
  verse: number,
): StrongToken[] {
  const data = JSON.parse(readFileSync(new URL(`interlinear/${testament}/${file}`, DATA), 'utf8'));
  const entry = data.find((v: { chapter: number; verse: number }) => v.chapter === chapter && v.verse === verse);
  return entry.words.map((w: Record<string, string>) => ({
    token: w.hebrew || w.hebrew_aramaic || w.greek || '',
    strongId: /^\d+$/.test(w.strong) && Number(w.strong) > 0 ? `${testament === 'greek' ? 'G' : 'H'}${w.strong}` : null,
    lemma: w.lemma,
  }));
}

const covered = (raw: string, spans: { start: number; end: number }[]) => spans.map((s) => raw.slice(s.start, s.end));

describe('alignStrongTokens · hebreo (WLC)', () => {
  it('alinea Génesis 1:1 aunque el interlineal parta las palabras pegadas', () => {
    const raw = bibleText('WLC', 'GEN.json', 1, 1);
    const spans = alignStrongTokens(raw, interlinearTokens('hebrew', 'GEN.json', 1, 1), 'hebrew');
    const texts = covered(raw, spans);

    // WLC escribe "בְּרֵאשִׁית" junto; el interlineal lo parte en בְּ (H9001) + רֵאשִׁית (H7225).
    expect(texts).toContain('בְּ');
    expect(texts).toContain('רֵאשִׁ֖ית');
    expect(spans.map((s) => s.strongId)).toContain('H9001');
    expect(spans.map((s) => s.strongId)).toContain('H7225');
    expect(spans.map((s) => s.strongId)).toContain('H430'); // אֱלֹהִים

    // Los spans consecutivos reconstruyen la palabra tal como se lee en WLC.
    expect(spans[0].start).toBe(0);
    expect(spans[1].start).toBe(spans[0].end);
    expect(raw.slice(spans[0].start, spans[1].end)).toBe('בְּרֵאשִׁ֖ית');
  });

  it('marca prácticamente todos los términos de Génesis 1:1', () => {
    const raw = bibleText('WLC', 'GEN.json', 1, 1);
    const words = interlinearTokens('hebrew', 'GEN.json', 1, 1);
    const withStrong = words.filter((w) => w.strongId).length;
    expect(alignStrongTokens(raw, words, 'hebrew').length).toBeGreaterThanOrEqual(withStrong - 1);
  });

  it('tolera el marcador de fin de versículo del interlineal (׃ ס)', () => {
    // 1 Cr 1:4: el último token trae "׃ ס", que WLC no tiene.
    const raw = bibleText('WLC', '1CH.json', 1, 4);
    const spans = alignStrongTokens(raw, interlinearTokens('hebrew', '1CH.json', 1, 4), 'hebrew');
    const texts = covered(raw, spans);

    expect(texts).toContain('נֹ֥חַ');
    expect(texts).toContain('שֵׁ֖ם');
    expect(texts.some((t) => t.includes('יָֽפֶת'))).toBe(true);
  });

  it('devuelve spans ordenados, sin solaparse y dentro del texto', () => {
    const cases: [string, number, number][] = [
      ['GEN.json', 1, 1],
      ['PSA.json', 23, 1],
      ['DAN.json', 3, 15],
      ['MAL.json', 3, 1],
    ];
    for (const [file, chapter, verse] of cases) {
      const raw = bibleText('WLC', file, chapter, verse);
      const spans = alignStrongTokens(raw, interlinearTokens('hebrew', file, chapter, verse), 'hebrew');
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
    const raw = bibleText('WLC', '1CH.json', 6, 25);
    expect(alignStrongTokens(raw, interlinearTokens('hebrew', '1CH.json', 6, 25), 'hebrew')).toEqual([]);
  });
});

describe('alignStrongTokens · griego (WHNU)', () => {
  it('alinea Mateo 1:1 aunque WHNU venga sin acentuar', () => {
    const raw = bibleText('WHNU', 'MAT.json', 1, 1);
    const spans = alignStrongTokens(raw, interlinearTokens('greek', 'MAT.json', 1, 1), 'greek');
    const texts = covered(raw, spans);

    // WHNU: "βιβλος γενεσεως ιησου χριστου υιου δαυιδ υιου αβρααμ"
    expect(texts).toEqual(['βιβλος', 'γενεσεως', 'ιησου', 'χριστου', 'υιου', 'δαυιδ', 'υιου', 'αβρααμ']);
    expect(spans.map((s) => s.strongId)).toContain('G976'); // Βίβλος
    expect(spans.map((s) => s.strongId)).toContain('G5547'); // Χριστοῦ
    expect(spans.map((s) => s.strongId)).toContain('G11'); // Ἀβραάμ
  });

  it('tolera la puntuación pegada al token final del interlineal', () => {
    // El interlineal cierra con "Ἰουδαίων;" y "αὐτῷ."; WHNU usa su propia puntuación.
    const raw = bibleText('WHNU', 'MAT.json', 2, 2);
    const spans = alignStrongTokens(raw, interlinearTokens('greek', 'MAT.json', 2, 2), 'greek');
    const texts = covered(raw, spans);

    expect(texts).toContain('ιουδαιων');
    expect(texts[texts.length - 1]).toBe('αυτω');
  });

  it('salta los corchetes de aparato que sólo tiene WHNU', () => {
    // Mt 1:18 en WHNU: "του δε [ιησου] ιησου χριστου…" (el corchete no está en el interlineal).
    const raw = bibleText('WHNU', 'MAT.json', 1, 18);
    const spans = alignStrongTokens(raw, interlinearTokens('greek', 'MAT.json', 1, 18), 'greek');
    const texts = covered(raw, spans);

    expect(spans.length).toBeGreaterThanOrEqual(20);
    expect(texts.join(' ')).not.toContain('[');
    expect(texts).toContain('ιησου');
    expect(texts).toContain('χριστου');
    expect(texts[texts.length - 1]).toBe('αγιου');
  });

  it('devuelve spans ordenados, sin solaparse y dentro del texto', () => {
    const cases: [string, number, number][] = [
      ['MAT.json', 5, 1],
      ['JHN.json', 1, 1],
      ['ROM.json', 8, 28],
      ['REV.json', 22, 21],
    ];
    for (const [file, chapter, verse] of cases) {
      const raw = bibleText('WHNU', file, chapter, verse);
      const spans = alignStrongTokens(raw, interlinearTokens('greek', file, chapter, verse), 'greek');
      let previousEnd = -1;
      for (const span of spans) {
        expect(span.start).toBeGreaterThanOrEqual(previousEnd);
        expect(span.end).toBeGreaterThan(span.start);
        expect(span.end).toBeLessThanOrEqual(raw.length);
        previousEnd = span.end;
      }
    }
  });
});

describe('alignStrongTokens · común a los dos alfabetos', () => {
  it('ignora tokens sin ficha Strong', () => {
    const raw = bibleText('WLC', 'GEN.json', 1, 1);
    const words = interlinearTokens('hebrew', 'GEN.json', 1, 1).map((w) => ({ ...w, strongId: null }));
    expect(alignStrongTokens(raw, words, 'hebrew')).toEqual([]);
  });

  it('no rompe con texto vacío, sin el alfabeto esperado o sin tokens', () => {
    const words = interlinearTokens('hebrew', 'GEN.json', 1, 1);
    expect(alignStrongTokens('', words, 'hebrew')).toEqual([]);
    expect(alignStrongTokens('En el principio creó Dios', words, 'hebrew')).toEqual([]);
    expect(alignStrongTokens('בְּרֵאשִׁית', [], 'hebrew')).toEqual([]);
    // Texto griego tratado como hebreo (o al revés) no debe inventar spans.
    expect(alignStrongTokens('βιβλος γενεσεως', words, 'greek')).toEqual([]);
  });

  it('no altera el texto: el versículo se reconstruye igual', () => {
    for (const [version, testament, file, chapter, verse] of [
      ['WLC', 'hebrew', 'GEN.json', 1, 2],
      ['WHNU', 'greek', 'MAT.json', 1, 1],
    ] as const) {
      const raw = bibleText(version, file, chapter, verse);
      const spans = alignStrongTokens(raw, interlinearTokens(testament, file, chapter, verse), testament);
      let rebuilt = '';
      let cursor = 0;
      for (const span of spans) {
        rebuilt += raw.slice(cursor, span.start) + raw.slice(span.start, span.end);
        cursor = span.end;
      }
      rebuilt += raw.slice(cursor);
      expect(rebuilt).toBe(raw);
    }
  });
});
