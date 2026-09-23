/**
 * Store TTS reactivo (Svelte 5) que envuelve `TtsController`.
 * Lógica de reproducción por bloques portada de NRVA `useTTS.ts:play`.
 */
import { TtsController, TTS_TEXT_SELECTOR } from './TtsController';
import type { VirtualVoice } from '../../../shared/utils/voices';

const HIGHLIGHT_CLASS = 'speaking-highlight';
const VOICE_PREF_KEY = 'aletheia_tts_voice';
const RATE_PREF_KEY = 'aletheia_tts_rate';

class TtsStore {
  public controller = new TtsController();
  public isPlaying = $state(false);
  public isPaused = $state(false);
  public isLoading = $state(false);
  public rate = $state(1.0);
  public voices = $state<VirtualVoice[]>([]);
  public selectedVoice = $state<VirtualVoice | null>(null);

  private utterances: SpeechSynthesisUtterance[] = [];
  private elements: Element[] = [];
  private index = 0;
  private stopping = false;
  private pausedRef = false;

  constructor() {
    this.controller.subscribe(() => this.sync());
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private sync(): void {
    const s = this.controller.snapshot();
    this.isPlaying = s.isPlaying;
    this.isPaused = s.isPaused;
    this.isLoading = s.isLoading;
    this.rate = s.rate;
    this.voices = s.voices;
    this.selectedVoice = s.selectedVoice;
  }

  private init(): void {
    const synth = window.speechSynthesis;
    let savedVoice: string | null = null;
    let savedRate = 1.0;
    try {
      savedVoice = localStorage.getItem(VOICE_PREF_KEY);
      savedRate = Number(localStorage.getItem(RATE_PREF_KEY) ?? '1') || 1.0;
    } catch {
      // sin almacenamiento
    }
    this.controller.attach(synth);
    this.controller.rate = savedRate;
    this.controller.reloadVoices(savedVoice);
    this.sync();

    const load = () => {
      this.controller.reloadVoices(this.controller.selectedVoice?.id ?? savedVoice);
      this.sync();
    };
    if ('onvoiceschanged' in synth && synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = load;
    }

    const stopAll = () => this.stop();
    window.addEventListener('beforeunload', stopAll);
    window.addEventListener('popstate', stopAll);
    document.addEventListener('astro:before-preparation', stopAll);
    document.addEventListener('astro:after-swap', stopAll);

    let lastUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        stopAll();
      }
    }, 500);
  }

  public setRate(next: number): void {
    this.controller.setRate(next);
    try {
      localStorage.setItem(RATE_PREF_KEY, String(next));
    } catch {
      // ignorar
    }
    this.sync();
  }

  public setVoice(id: string | null): void {
    const voice = this.voices.find((v) => v.id === id) ?? null;
    this.controller.setVoice(voice);
    try {
      if (id) localStorage.setItem(VOICE_PREF_KEY, id);
    } catch {
      // ignorar
    }
    this.sync();
    if (this.pausedRef && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }

  public toggle(selector = TTS_TEXT_SELECTOR): void {
    if (this.isPlaying && this.isPaused) {
      this.resume();
      return;
    }
    if (this.isPlaying && !this.isPaused) {
      this.pause();
      return;
    }
    this.play(selector);
  }

  public pause(): void {
    this.controller.pause();
    this.pausedRef = true;
    this.sync();
  }

  public resume(): void {
    this.controller.resume();
    this.pausedRef = false;
    this.sync();
  }

  public stop(): void {
    this.stopping = true;
    this.controller.stop();
    this.utterances = [];
    this.elements = [];
    this.index = 0;
    this.pausedRef = false;
    this.sync();
    setTimeout(() => {
      this.stopping = false;
      this.sync();
    }, 150);
  }

  public play(selector = TTS_TEXT_SELECTOR): void {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (this.stopping) {
      setTimeout(() => this.play(selector), 200);
      return;
    }
    synth.cancel();
    setTimeout(() => {
      this.isLoading = true;
      this.isPlaying = true;
      this.isPaused = false;
      this.controller.isPlaying = true;
      this.controller.isPaused = false;
      this.controller.isLoading = true;
      this.stopping = false;

      const elements = Array.from(document.querySelectorAll(selector));
      if (elements.length === 0) {
        this.isLoading = false;
        this.isPlaying = false;
        this.controller.isPlaying = false;
        this.controller.isLoading = false;
        return;
      }
      this.elements = elements;
      this.index = 0;
      this.utterances = [];
      this.speakNext();
    }, 150);
  }

  private speakNext(): void {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (this.stopping) return;
    if (this.index >= this.elements.length) {
      this.stop();
      return;
    }
    const element = this.elements[this.index];
    if (!element || !document.body.contains(element)) {
      this.stop();
      return;
    }
    const text = TtsController.extractText(element);
    if (!text) {
      this.index++;
      this.speakNext();
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    const sysVoice = this.selectedVoice?.systemVoice;
    if (sysVoice) {
      u.voice = sysVoice;
      u.lang = sysVoice.lang;
    } else {
      u.lang = this.selectedVoice?.locale ?? 'es-ES';
    }
    u.rate = this.rate;
    this.utterances.push(u);
    if (this.utterances.length > 5) this.utterances.shift();

    u.onstart = () => {
      if (this.stopping) return;
      this.isLoading = false;
      document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => el.classList.remove(HIGHLIGHT_CLASS));
      element.classList.add(HIGHLIGHT_CLASS);
      const rect = element.getBoundingClientRect();
      if (!(rect.top >= 50 && rect.bottom <= window.innerHeight - 50)) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    u.onend = () => {
      if (this.stopping) return;
      this.index++;
      if (document.body.contains(element) && this.index < this.elements.length) {
        setTimeout(() => this.speakNext(), 150);
      } else {
        this.stop();
      }
    };
    u.onerror = (event) => {
      const code = (event as { error?: string }).error;
      if (code === 'interrupted' || code === 'canceled') {
        if (!this.stopping) setTimeout(() => this.speakNext(), 100);
        return;
      }
      if (!this.stopping && this.index < this.elements.length - 1) {
        this.index++;
        setTimeout(() => this.speakNext(), 200);
      } else {
        this.stop();
      }
    };

    setTimeout(
      () => {
        if (!this.stopping) {
          synth.speak(u);
          if (this.pausedRef) synth.pause();
        }
      },
      this.index === 0 ? 0 : 100,
    );
  }
}

export const ttsStore = new TtsStore();
