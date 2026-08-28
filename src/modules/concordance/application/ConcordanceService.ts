import type { TranslationId } from '../../bible-reader/domain/entities/Translation';
import { cacheBust } from '../../../shared/utils/cacheBust';
import {
  parseConcordanceQuery,
  type ParsedConcordanceQuery,
} from '../domain/ConcordanceQuery';
import type {
  ConcordanceVerseMatch,
  ConcordanceSearchResponse,
  ConcordanceFacets,
  TestamentFilterOption,
  ConcordanceSortOrder,
} from '../domain/ConcordanceResult';

type RawVerseTuple = [
  string, // 0: bookCode
  string, // 1: bookName
  number, // 2: chapter
  number, // 3: verseNumber
  string, // 4: rawText
  string, // 5: normalizedText
  'AT' | 'NT', // 6: testament
  string  // 7: category
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class ConcordanceService {
  private static cache = new Map<TranslationId, RawVerseTuple[]>();

  public async loadTranslationIndex(translationId: TranslationId): Promise<RawVerseTuple[]> {
    if (ConcordanceService.cache.has(translationId)) {
      return ConcordanceService.cache.get(translationId)!;
    }

    try {
      const res = await fetch(cacheBust(`/data/concordance/${translationId}.json`));
      if (!res.ok) {
        throw new Error(`Failed to load concordance index for ${translationId}`);
      }
      const data: RawVerseTuple[] = await res.json();
      ConcordanceService.cache.set(translationId, data);
      return data;
    } catch (err) {
      console.error(`Error loading concordance data for ${translationId}:`, err);
      return [];
    }
  }

  public async search(params: {
    query: string;
    translationId: TranslationId;
    testamentFilter?: TestamentFilterOption;
    categoryFilter?: string;
    bookFilter?: string;
    sortOrder?: ConcordanceSortOrder;
    limit?: number;
    offset?: number;
  }): Promise<ConcordanceSearchResponse> {
    const startTime = performance.now();
    const {
      query,
      translationId,
      testamentFilter = 'ALL',
      categoryFilter,
      bookFilter,
      sortOrder = 'canonical',
      limit = 50,
      offset = 0,
    } = params;

    const verses = await this.loadTranslationIndex(translationId);
    const parsed = parseConcordanceQuery(query);

    if (!parsed.raw.trim() || verses.length === 0) {
      return {
        query,
        translationId,
        totalMatches: 0,
        filteredMatches: 0,
        facets: { total: 0, otCount: 0, ntCount: 0, categoryCounts: {} },
        results: [],
        searchDurationMs: Math.round(performance.now() - startTime),
      };
    }

    // Pre-compile word-boundary regular expressions for instant execution
    const requiredMatchers = parsed.requiredWords.map(
      (w) => new RegExp(`(^|\\s)${escapeRegex(w)}(?:es|s)?(\\s|$)`, 'i')
    );
    const exactMatchers = parsed.exactPhrases.map(
      (p) => new RegExp(`(^|\\s)${escapeRegex(p)}(\\s|$)`, 'i')
    );
    const excludedMatchers = parsed.excludedWords.map(
      (w) => new RegExp(`(^|\\s)${escapeRegex(w)}(?:es|s)?(\\s|$)`, 'i')
    );

    const allMatches: ConcordanceVerseMatch[] = [];
    const facets: ConcordanceFacets = {
      total: 0,
      otCount: 0,
      ntCount: 0,
      categoryCounts: {},
    };

    for (let i = 0; i < verses.length; i++) {
      const v = verses[i];
      const normText = v[5];

      // 1. Excluded words check (NOT)
      let excluded = false;
      for (let j = 0; j < excludedMatchers.length; j++) {
        if (excludedMatchers[j].test(normText)) {
          excluded = true;
          break;
        }
      }
      if (excluded) continue;

      // 2. Exact phrases check
      let exactFailed = false;
      for (let j = 0; j < exactMatchers.length; j++) {
        if (!exactMatchers[j].test(normText)) {
          exactFailed = true;
          break;
        }
      }
      if (exactFailed) continue;

      // 3. Required words check (AND) with word boundaries
      let requiredFailed = false;
      for (let j = 0; j < requiredMatchers.length; j++) {
        if (!requiredMatchers[j].test(normText)) {
          requiredFailed = true;
          break;
        }
      }
      if (requiredFailed) continue;

      // Found a valid match
      facets.total++;
      const testament = v[6];
      if (testament === 'AT') facets.otCount++;
      if (testament === 'NT') facets.ntCount++;

      const category = v[7];
      facets.categoryCounts[category] = (facets.categoryCounts[category] || 0) + 1;

      // Check if it passes active search filters
      if (testamentFilter !== 'ALL' && testament !== testamentFilter) {
        continue;
      }
      if (categoryFilter && category !== categoryFilter) {
        continue;
      }
      if (bookFilter && v[0] !== bookFilter) {
        continue;
      }

      const score = this.calculateRelevance(v, parsed);
      const match: ConcordanceVerseMatch = {
        bookCode: v[0],
        bookName: v[1],
        chapter: v[2],
        verseNumber: v[3],
        rawText: v[4],
        normalizedText: normText,
        testament,
        category,
        score,
        reference: `${v[1]} ${v[2]}:${v[3]}`,
      };

      allMatches.push(match);
    }

    // Sort results
    if (sortOrder === 'relevance') {
      allMatches.sort((a, b) => b.score - a.score);
    }

    const filteredMatches = allMatches.length;
    const paginated = allMatches.slice(offset, offset + limit);
    const searchDurationMs = Math.round(performance.now() - startTime);

    return {
      query,
      translationId,
      totalMatches: facets.total,
      filteredMatches,
      facets,
      results: paginated,
      searchDurationMs,
    };
  }

  private matchesCriteria(normText: string, parsed: ParsedConcordanceQuery): boolean {
    // 1. Excluded words (NOT)
    for (let i = 0; i < parsed.excludedWords.length; i++) {
      const exc = parsed.excludedWords[i];
      if (normText.includes(exc)) return false;
    }

    // 2. Exact phrases
    for (let i = 0; i < parsed.exactPhrases.length; i++) {
      const phrase = parsed.exactPhrases[i];
      if (!normText.includes(phrase)) return false;
    }

    // 3. Required words (AND)
    for (let i = 0; i < parsed.requiredWords.length; i++) {
      const word = parsed.requiredWords[i];
      if (!normText.includes(word)) return false;
    }

    return true;
  }

  private calculateRelevance(v: RawVerseTuple, parsed: ParsedConcordanceQuery): number {
    let score = 0;
    const normText = v[5];
    const wordsInVerse = normText.split(' ').length;

    // Exact phrases bonus
    for (const phrase of parsed.exactPhrases) {
      if (normText.includes(phrase)) score += 25;
    }

    // Term frequency and exact word boundary bonus
    for (const word of parsed.requiredWords) {
      let idx = 0;
      let count = 0;
      while ((idx = normText.indexOf(word, idx)) !== -1) {
        count++;
        // Check if it is a whole word boundary
        const isStart = idx === 0 || normText[idx - 1] === ' ';
        const isEnd = idx + word.length === normText.length || normText[idx + word.length] === ' ';
        if (isStart && isEnd) {
          score += 10;
        } else {
          score += 4;
        }
        idx += word.length;
      }
    }

    // Density ratio: higher score if concise verse
    if (wordsInVerse > 0) {
      score += Math.min(10, Math.round(50 / wordsInVerse));
    }

    return score;
  }
}