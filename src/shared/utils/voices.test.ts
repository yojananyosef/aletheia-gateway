import { describe, expect, it } from 'vitest';
import { mapSystemVoicesToVirtual, pickDefaultVoice } from './voices';

const mk = (name: string, lang: string) => ({ name, lang });

describe('voices', () => {
  it('filtra solo voces es* y excluye vernon', () => {
    const out = mapSystemVoicesToVirtual([
      mk('Google español', 'es-ES'),
      mk('Paulina', 'es-MX'),
      mk('Vernon', 'es-US'),
      mk('Catalan voice', 'ca-ES'),
      mk('English voice', 'en-US'),
    ]);
    expect(out.map((v) => v.locale)).toEqual(['es-ES', 'es-MX']);
  });

  it('limpia etiquetas Microsoft/Desktop y parentesis', () => {
    const out = mapSystemVoicesToVirtual([mk('Microsoft Sabina Desktop (Spain)', 'es-ES')]);
    expect(out[0].label).toBe('Sabina');
  });

  it('devuelve null sin voces y primera voz por defecto', () => {
    expect(pickDefaultVoice([])).toBeNull();
    const voices = mapSystemVoicesToVirtual([mk('Elena', 'es-ES'), mk('Jorge', 'es-MX')]);
    expect(pickDefaultVoice(voices)?.locale).toBe('es-ES');
  });
});
