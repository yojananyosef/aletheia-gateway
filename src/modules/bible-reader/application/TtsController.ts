/**
 * Controlador TTS con Web Speech API (port de NRVA `useTTS.ts`).
 * Clase plana sin runes Svelte para ser testeable en node (vitest).
 * El wrapper reactivo vive en `tts.svelte.ts`.
 */
import { mapSystemVoicesToVirtual, pickDefaultVoice, type VirtualVoice } from '../../../shared/utils/voices';

export const TTS_TEXT_SELECTOR = '.verses-content .passage-text, .verse-section-heading';
const HIGHLIGHT_CLASS = 'speaking-highlight';

export interface TtsSnapshot {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  rate: number;
  voices: VirtualVoice[];
  selectedVoice: VirtualVoice | null;
}

interface SynthLike {
  speaking: boolean;
  pending: boolean;
  paused: boolean;
  cancel(): void;
  pause(): void;
  resume(): void;
  speak(u: unknown): void;
  getVoices(): SpeechSynthesisVoice[];
  onvoiceschanged?: unknown;
}

export class TtsController {
  public isPlaying = false;
  public isPaused = false;
  public isLoading = false;
  public rate = 1.0;
  public voices: VirtualVoice[] = [];
  public selectedVoice: VirtualVoice | null = null;

  private synth: SynthLike | null = null;
  private elements: Element[] = [];
  private index = 0;
  private stopping = false;
  private kept: unknown[] = [];
  private onChange: (() => void) | null = null;

  public attach(synth: SynthLike | null): void {
    this.synth = synth;
    if (synth) this.reloadVoices();
  }

  public subscribe(fn: () => void): void {
    this.onChange = fn;
  }

  private emit(): void {
    this.onChange?.();
  }

  public reloadVoices(preferredId?: string | null): void {
    if (!this.synth) return;
    const virtual = mapSystemVoicesToVirtual(this.synth.getVoices());
    this.voices = virtual;
    const saved = preferredId ? virtual.find((v) => v.id === preferredId) : undefined;
    this.selectedVoice = saved ?? pickDefaultVoice(virtual);
    this.emit();
  }

  public setRate(next: number): void {
    this.rate = next;
    if (this.synth && (this.synth.speaking || this.synth.pending)) {
      this.synth.cancel();
    }
    this.emit();
  }

  public setVoice(voice: VirtualVoice | null): string | null {
    this.selectedVoice = voice;
    if (this.synth && (this.synth.speaking || this.synth.pending)) {
      this.synth.cancel();
    }
    this.emit();
    return voice ? voice.id : null;
  }

  public snapshot(): TtsSnapshot {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      isLoading: this.isLoading,
      rate: this.rate,
      voices: this.voices,
      selectedVoice: this.selectedVoice,
    };
  }

  public stop(): void {
    this.stopping = true;
    if (this.synth) {
      this.synth.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this.isLoading = false;
      this.index = 0;
      this.kept = [];
      if (typeof document !== 'undefined') {
        document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => el.classList.remove(HIGHLIGHT_CLASS));
      }
    }
    this.emit();
    setTimeout(() => {
      this.stopping = false;
    }, 150);
  }

  public pause(): void {
    if (this.synth && this.isPlaying && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
      this.emit();
    }
  }

  public resume(): void {
    if (this.synth && this.isPlaying && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.emit();
    }
  }

  /** Extrae texto legible de un bloque, sin números de versículo ni notas. */
  public static extractText(element: Element): string {
    const clone = element.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll('.verse-num, sup, .sr-only, .footnote-ref, a, .commentary-icon, svg, button, .select-none-ui')
      .forEach((el) => el.remove());
    return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
  }
}
