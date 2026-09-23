/**
 * Voces virtuales ES para TTS (port de NRVA-Reader `voiceUtils.ts`).
 * Puro TypeScript, sin DOM: filtra voces `es*` y genera etiquetas legibles.
 */

export interface VirtualVoice {
  id: string;
  label: string;
  locale: string;
  gender: 'male' | 'female';
  systemVoice: SpeechSynthesisVoice | null;
  matchType?: 'exact' | 'region' | 'fallback' | 'default';
}

interface SystemVoiceLike {
  name: string;
  lang: string;
}

function isGender(voice: SystemVoiceLike, gender: 'male' | 'female'): boolean {
  const name = voice.name.toLowerCase();
  if (gender === 'female') {
    return (
      name.includes('female') ||
      name.includes('femenina') ||
      name.includes('woman') ||
      name.includes('monica') ||
      name.includes('paulina') ||
      name.includes('sabina') ||
      name.includes('helena') ||
      name.includes('zira') ||
      name.includes('francisca') ||
      name.includes('samantha') ||
      name.includes('victoria') ||
      name.includes('laura') ||
      name.includes('mia') ||
      name.includes('google español')
    );
  }
  return (
    name.includes('male') ||
    name.includes('masculino') ||
    name.includes('hombre') ||
    name.includes('jorge') ||
    name.includes('juan') ||
    name.includes('diego') ||
    name.includes('pablo') ||
    name.includes('raul') ||
    name.includes('miguel') ||
    name.includes('pedro') ||
    name.includes('daniel') ||
    name.includes('jose') ||
    name.includes('david') ||
    name.includes('mark') ||
    name.includes('stefan') ||
    name.includes('roberto') ||
    name.includes('carlos') ||
    name.includes('fernando') ||
    name.includes('antonio') ||
    name.includes('manuel') ||
    name.includes('alberto')
  );
}

export function mapSystemVoicesToVirtual<T extends SystemVoiceLike>(systemVoices: T[]): VirtualVoice[] {
  const spanishVoices = systemVoices.filter(
    (v) =>
      (v.lang.toLowerCase().startsWith('es') || v.lang.toLowerCase() === 'es') &&
      !v.name.toLowerCase().includes('vernon'),
  );

  return spanishVoices.map((voice, index) => {
    const gender = isGender(voice, 'male') ? 'male' : 'female';

    let label = voice.name;
    label = label.replace(/Microsoft\s+/i, '').replace(/\s+Desktop/i, '');
    if (label.includes(' - ')) label = label.split(' - ')[0];
    label = label.replace(/^Android\s+Speech\s+Recognition\s+Service\s+/i, '');
    const withoutParens = label.replace(/\s*\(.*?\)\s*/g, '').trim();
    if (withoutParens.length > 2) label = withoutParens;
    label = label.trim();
    const langRegex =
      /\b(español|spanish|es|spain|españa|mexico|méxico|united states|estados unidos|latinoamérica|latin america)\b/gi;
    const withoutLang = label.replace(langRegex, '').replace(/\s+/g, ' ').trim();
    if (withoutLang.length > 1) label = withoutLang;
    label = label.charAt(0).toUpperCase() + label.slice(1);

    return {
      id: `sys-${voice.lang}-${index}-${gender}`,
      label,
      locale: voice.lang,
      gender,
      systemVoice: (voice as unknown as SpeechSynthesisVoice) ?? null,
      matchType: 'exact' as const,
    };
  });
}

export function pickDefaultVoice(voices: VirtualVoice[]): VirtualVoice | null {
  if (voices.length === 0) return null;
  return voices.find((v) => v.id === 'es-ES-female') ?? voices[0];
}
