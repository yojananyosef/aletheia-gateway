export interface ParsedCbaText {
  phrase: string;
  content: string;
  refs: string[];
}

/**
 * Parsea el texto de un versículo del CBA en formato gateway:
 * "{frase} — {contenido} (Cf. ref1; ref2)".
 * Frase y referencias son opcionales.
 */
export function parseCbaText(text: string): ParsedCbaText {
  let refs: string[] = [];
  let body = text;
  const refMatch = text.match(/\(Cf\. (.*)\)\s*$/);
  if (refMatch) {
    refs = refMatch[1]
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    body = text.slice(0, refMatch.index).trim();
  }
  const sep = body.indexOf(' — ');
  if (sep !== -1) {
    return { phrase: body.slice(0, sep), content: body.slice(sep + 3).trim(), refs };
  }
  return { phrase: '', content: body, refs };
}
