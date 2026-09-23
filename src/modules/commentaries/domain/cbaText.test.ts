import { describe, expect, it } from 'vitest';
import { parseCbaText } from './cbaText';

describe('parseCbaText', () => {
  it('separa frase, contenido y referencias', () => {
    const parsed = parseCbaText('En el principio. — Estas palabras nos recuerdan. (Cf. Heb. 1: 10-12; Sal. 90: 2)');
    expect(parsed.phrase).toBe('En el principio.');
    expect(parsed.content).toBe('Estas palabras nos recuerdan.');
    expect(parsed.refs).toEqual(['Heb. 1: 10-12', 'Sal. 90: 2']);
  });

  it('funciona sin referencias', () => {
    const parsed = parseCbaText('Fueron, pues, acabados. — Los primeros versículos.');
    expect(parsed.phrase).toBe('Fueron, pues, acabados.');
    expect(parsed.content).toBe('Los primeros versículos.');
    expect(parsed.refs).toEqual([]);
  });

  it('funciona sin frase (solo contenido)', () => {
    const parsed = parseCbaText('Comentario sin frase destacada.');
    expect(parsed.phrase).toBe('');
    expect(parsed.content).toBe('Comentario sin frase destacada.');
    expect(parsed.refs).toEqual([]);
  });
});
