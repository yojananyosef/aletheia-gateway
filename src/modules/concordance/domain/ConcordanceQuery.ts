export interface ParsedConcordanceQuery {
  raw: string;
  exactPhrases: string[];
  requiredWords: string[];
  excludedWords: string[];
  allTokens: string[];
}

export function normalizeSpanish(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[«»“”"''`.,;:!?¡¿()\-[\]{}_/\\*#%~^+=<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseConcordanceQuery(input: string): ParsedConcordanceQuery {
  const raw = input.trim();
  const exactPhrases: string[] = [];
  const requiredWords: string[] = [];
  const excludedWords: string[] = [];
  const allTokens: string[] = [];

  if (!raw) {
    return { raw, exactPhrases, requiredWords, excludedWords, allTokens };
  }

  // 1. Extract exact phrases between quotes "..."
  let remaining = raw.replace(/"([^"]+)"/g, (_, phrase) => {
    const normPhrase = normalizeSpanish(phrase);
    if (normPhrase) {
      exactPhrases.push(normPhrase);
      allTokens.push(...normPhrase.split(' ').filter(Boolean));
    }
    return '';
  });

  // 2. Extract remaining words and exclusions
  const tokens = remaining.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    if (token.startsWith('-') && token.length > 1) {
      const norm = normalizeSpanish(token.slice(1));
      if (norm) excludedWords.push(norm);
    } else {
      const norm = normalizeSpanish(token);
      if (norm) {
        requiredWords.push(norm);
        allTokens.push(norm);
      }
    }
  }

  return {
    raw,
    exactPhrases,
    requiredWords,
    excludedWords,
    allTokens: Array.from(new Set(allTokens)),
  };
}