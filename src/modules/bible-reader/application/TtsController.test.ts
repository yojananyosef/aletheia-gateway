import { describe, expect, it, vi } from 'vitest';
import { TtsController } from './TtsController';

function fakeSynth() {
  return {
    speaking: false,
    pending: false,
    paused: false,
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    speak: vi.fn(),
    getVoices: () => [
      { name: 'Sabina', lang: 'es-ES' },
      { name: 'Jorge', lang: 'es-MX' },
    ],
  };
}

describe('TtsController', () => {
  it('carga voces ES y selecciona la primera', () => {
    const c = new TtsController();
    c.attach(fakeSynth() as unknown as SpeechSynthesis);
    expect(c.voices).toHaveLength(2);
    expect(c.selectedVoice?.locale).toBe('es-ES');
  });

  it('respeta voz preferida guardada', () => {
    const c = new TtsController();
    c.attach(fakeSynth() as unknown as SpeechSynthesis);
    const second = c.voices[1];
    c.reloadVoices(second.id);
    expect(c.selectedVoice?.id).toBe(second.id);
  });

  it('setRate cancela el motor en curso', () => {
    const c = new TtsController();
    const synth = fakeSynth();
    synth.speaking = true;
    c.attach(synth as unknown as SpeechSynthesis);
    c.setRate(1.5);
    expect(c.rate).toBe(1.5);
    expect(synth.cancel).toHaveBeenCalled();
  });

  it('extractText elimina sup y notas (fake DOM)', () => {
    const removed: string[] = [];
    const fakeEl = {
      cloneNode: () => ({
        querySelectorAll: (_sel: string) => ({
          forEach: (fn: (el: { remove: () => void }) => void) => {
            removed.push(_sel);
            fn({ remove: () => {} });
          },
        }),
        textContent: '  En el principio creó Dios   los cielos. ',
      }),
    };
    expect(TtsController.extractText(fakeEl as unknown as Element)).toBe('En el principio creó Dios los cielos.');
    expect(removed.length).toBeGreaterThan(0);
  });

  it('stop resetea estado', () => {
    const c = new TtsController();
    c.attach(fakeSynth() as unknown as SpeechSynthesis);
    c.isPlaying = true;
    c.stop();
    expect(c.isPlaying).toBe(false);
    expect(c.isLoading).toBe(false);
  });
});
