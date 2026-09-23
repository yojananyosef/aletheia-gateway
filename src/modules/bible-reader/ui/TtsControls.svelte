<script lang="ts">
  import { Play, Pause, Square, Volume2 } from 'lucide-svelte';
  import NeoDropdown from '../../../shared/ui/NeoDropdown.svelte';
  import { ttsStore } from '../application/tts.svelte';

  const RATES = [0.75, 1.0, 1.25, 1.5, 1.75];

  let voiceOptions = $derived(
    ttsStore.voices.map((v) => ({ value: v.id, label: `${v.label} (${v.locale})` })),
  );
  let rateOptions = $derived(RATES.map((r) => ({ value: r, label: `${r}x` })));
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
    <div class="tts-dropdown tts-voice-dropdown">
      <NeoDropdown
        label="Voz"
        selectedValue={ttsStore.selectedVoice?.id ?? ''}
        options={voiceOptions}
        menuLabel="Voces en español"
        onSelect={(v) => ttsStore.setVoice(String(v) || null)}
      />
    </div>
  {/if}

  <div class="tts-dropdown tts-rate-dropdown">
    <NeoDropdown
      label="Vel."
      selectedValue={ttsStore.rate}
      options={rateOptions}
      menuLabel="Velocidad de lectura"
      onSelect={(v) => ttsStore.setRate(Number(v))}
    />
  </div>

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
  .tts-dropdown {
    min-width: 0;
  }
  .tts-voice-dropdown {
    width: 150px;
    flex-shrink: 1;
  }
  .tts-rate-dropdown {
    width: 96px;
    flex-shrink: 0;
  }
  .tts-loading {
    font-size: 0.75rem;
    font-weight: 700;
  }
</style>
