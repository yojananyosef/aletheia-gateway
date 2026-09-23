<script lang="ts">
  import { Play, Pause, Square, Volume2 } from 'lucide-svelte';
  import { ttsStore } from '../application/tts.svelte';

  const RATES = [0.75, 1.0, 1.25, 1.5, 1.75];
</script>

<div class="tts-controls" role="group" aria-label="Audio Biblia (texto a voz)">
  {#if !ttsStore.isPlaying}
    <button
      type="button"
      class="toolbar-action-btn tts-play-btn"
      data-tooltip="Escuchar capítulo (Audio Biblia)"
      aria-label="Escuchar capítulo"
      onclick={() => ttsStore.play()}
    >
      <Volume2 size={16} />
      <span class="hidden md:inline">Escuchar</span>
    </button>
  {:else if !ttsStore.isPaused}
    <button
      type="button"
      class="toolbar-action-btn tts-play-btn is-active"
      data-tooltip="Pausar lectura"
      aria-label="Pausar lectura"
      aria-pressed="true"
      onclick={() => ttsStore.pause()}
    >
      <Pause size={16} />
      <span class="hidden md:inline">Pausar</span>
    </button>
  {:else}
    <button
      type="button"
      class="toolbar-action-btn tts-play-btn is-active"
      data-tooltip="Continuar lectura"
      aria-label="Continuar lectura"
      onclick={() => ttsStore.resume()}
    >
      <Play size={16} />
      <span class="hidden md:inline">Seguir</span>
    </button>
  {/if}

  {#if ttsStore.isPlaying}
    <button
      type="button"
      class="toolbar-action-btn"
      data-tooltip="Detener lectura"
      aria-label="Detener lectura"
      onclick={() => ttsStore.stop()}
    >
      <Square size={16} />
    </button>
  {/if}

  {#if ttsStore.voices.length > 0}
    <select
      class="tts-voice-select"
      aria-label="Voz de lectura"
      data-tooltip="Voz de lectura"
      value={ttsStore.selectedVoice?.id ?? ''}
      onchange={(e) => ttsStore.setVoice((e.target as HTMLSelectElement).value || null)}
    >
      {#each ttsStore.voices as voice}
        <option value={voice.id}>{voice.label} ({voice.locale})</option>
      {/each}
    </select>
  {/if}

  <select
    class="tts-rate-select"
    aria-label="Velocidad de lectura"
    data-tooltip="Velocidad de lectura"
    value={String(ttsStore.rate)}
    onchange={(e) => ttsStore.setRate(Number((e.target as HTMLSelectElement).value))}
  >
    {#each RATES as r}
      <option value={String(r)}>{r}x</option>
    {/each}
  </select>

  {#if ttsStore.isLoading}
    <span class="tts-loading" aria-live="polite">Cargando voz…</span>
  {/if}
</div>

<style>
  .tts-controls {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .tts-voice-select,
  .tts-rate-select {
    border: 2px solid var(--border-color);
    background: var(--bg-surface);
    color: var(--text-main);
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 6px;
    max-width: 160px;
  }
  .tts-rate-select {
    max-width: 72px;
  }
  .tts-loading {
    font-size: 0.75rem;
    font-weight: 700;
  }
</style>
