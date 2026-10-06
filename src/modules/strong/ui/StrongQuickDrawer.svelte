<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { BookOpen, Volume2, VolumeX, X } from 'lucide-svelte';
  import { JsonStrongRepository } from '../infrastructure/JsonStrongRepository';
  import { OccurrencesRepository, type StrongOccurrences } from '../infrastructure/OccurrencesRepository';
  import type { StrongEntry } from '../domain/StrongEntry';

  interface Props {
    isOpen: boolean;
    strongId: string | null;
    referenceLabel?: string;
    onClose: () => void;
    onOpenDictionary?: (strongId: string) => void;
  }

  let {
    isOpen = false,
    strongId = null,
    referenceLabel = '',
    onClose,
    onOpenDictionary,
  }: Props = $props();

  const strongRepo = new JsonStrongRepository();
  const occurrencesRepo = new OccurrencesRepository();

  let entry = $state<StrongEntry | null>(null);
  let occurrences = $state<StrongOccurrences | null>(null);
  let isLoading = $state(false);
  let isPlaying = $state(false);

  const audioMissingIds = new Set([
    'H9001', 'H9002', 'H9003', 'H9004', 'H9005', 'H9006',
    'H3544', 'H3577', 'H5713', 'H7267', 'H7609', 'H8354',
    'H8566', 'H8603', 'H8642', 'H8674', 'H8675',
    'G136', 'G867', 'G1027', 'G1467', 'G1737', 'G2103', 'G2618',
    'G2795', 'G3212', 'G3336', 'G3363', 'G3507', 'G4274', 'G4275',
    'G4398', 'G4446', 'G4620', 'G4624', 'G4688', 'G5025', 'G5052',
    'G5109', 'G5515', 'G5607',
  ]);

  function occurrenceLabel(ref: string): string {
    const [code, cv] = ref.split(' ');
    if (!cv) return ref;
    const [chapter, verse] = cv.split(':');
    return `${code} ${chapter}:${verse}`;
  }

  async function loadStrong(id: string) {
    isLoading = true;
    try {
      const [nextEntry, nextOccurrences] = await Promise.all([
        strongRepo.getById(id),
        occurrencesRepo.get(id),
      ]);
      if (strongId === id) {
        entry = nextEntry;
        occurrences = nextOccurrences;
      }
    } finally {
      if (strongId === id) isLoading = false;
    }
  }

  async function playAudio() {
    if (!entry || audioMissingIds.has(entry.id) || isPlaying) return;
    isPlaying = true;
    try {
      const audio = new Audio(entry.audioPath);
      await audio.play();
      audio.addEventListener('ended', () => (isPlaying = false), { once: true });
      audio.addEventListener('error', () => (isPlaying = false), { once: true });
    } catch {
      isPlaying = false;
    }
  }

  function handleKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) onClose();
  }

  $effect(() => {
    const id = strongId?.trim().toUpperCase() || null;
    if (isOpen && id) {
      loadStrong(id);
    } else {
      entry = null;
      occurrences = null;
      isLoading = false;
    }
  });

  onMount(() => {
    document.addEventListener('keydown', handleKey);
  });

  onDestroy(() => {
    document.removeEventListener('keydown', handleKey);
  });
</script>

{#if isOpen}
  <button type="button" class="strong-quick-backdrop" onclick={onClose} aria-label="Cerrar panel Strong"></button>
  <aside class="strong-quick-drawer" aria-label="Strong quick view">
    <div class="strong-quick-header">
      <div>
        <h2>Strong rápido</h2>
        {#if referenceLabel}<span>{referenceLabel}</span>{/if}
      </div>
      <button type="button" class="strong-quick-close" onclick={onClose} aria-label="Cerrar panel Strong">
        <X size={18} />
      </button>
    </div>

    {#if isLoading}
      <p class="strong-quick-state">Cargando…</p>
    {:else if entry}
      {@const isHebrew = entry.testament === 'hebrew'}
      <div class="strong-quick-body">
        <span class="strong-quick-id">Strong {isHebrew ? 'hebreo' : 'griego'} #{entry.number}</span>
        <p class="strong-quick-word" dir={isHebrew ? 'rtl' : 'ltr'} lang={isHebrew ? 'he' : 'el'}>
          {entry.word || '—'}
        </p>
        <p class="strong-quick-pron">{entry.pronunciation || '—'}</p>
        <button
          type="button"
          class="strong-quick-audio"
          disabled={audioMissingIds.has(entry.id)}
          onclick={playAudio}
          aria-label="Escuchar pronunciación"
        >
          {#if audioMissingIds.has(entry.id)}
            <VolumeX size={16} /><span>Sin audio</span>
          {:else}
            <Volume2 size={16} /><span>{isPlaying ? 'Reproduciendo…' : 'Escuchar'}</span>
          {/if}
        </button>

        <dl class="strong-quick-fields">
          <div><dt>Definición</dt><dd>{entry.definition || '—'}</dd></div>
          <div><dt>Def. en RV</dt><dd>{entry.rvDefinition || '—'}</dd></div>
          {#if entry.stepGloss || entry.stepDefinition}
            <div>
              <dt>Léxico STEPBible</dt>
              <dd>
                {#if entry.stepGloss}<strong>{entry.stepGloss}</strong>{/if}
                {#if entry.stepDefinition && entry.stepDefinition !== entry.stepGloss}
                  <span>{entry.stepDefinition}</span>
                {/if}
              </dd>
            </div>
          {/if}
        </dl>

        <p class="strong-quick-occ">
          {#if occurrences}
            {occurrences.n.toLocaleString('es-CL')} {occurrences.n === 1 ? 'versículo' : 'versículos'}
          {:else}
            Sin ocurrencias registradas.
          {/if}
        </p>

        <button type="button" class="strong-quick-open" onclick={() => onOpenDictionary?.(entry.id)}>
          <BookOpen size={15} />
          <span>Abrir diccionario completo</span>
        </button>
      </div>
    {:else}
      <p class="strong-quick-state">No se encontró la entrada Strong.</p>
    {/if}
  </aside>
{/if}

<style>
  .strong-quick-backdrop {
    position: fixed;
    inset: 0;
    z-index: 55;
    background: rgba(0, 0, 0, 0.36);
    border: 0;
  }

  .strong-quick-drawer {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 56;
    width: min(420px, 92vw);
    height: 100vh;
    padding: 14px;
    background: var(--bg-surface);
    border-left: 3px solid var(--border-color);
    box-shadow: -6px 0 0 var(--border-color);
    overflow-y: auto;
  }

  .strong-quick-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
  }

  .strong-quick-header h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 900;
  }

  .strong-quick-header span {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 700;
    opacity: 0.8;
  }

  .strong-quick-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: 2px solid var(--border-color);
    background: var(--bg-canvas);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
  }

  .strong-quick-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .strong-quick-id {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .strong-quick-word {
    margin: 0;
    font-size: 2rem;
    font-weight: 800;
    line-height: 1.2;
  }

  .strong-quick-pron {
    margin: 0;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.8rem;
    font-weight: 700;
  }

  .strong-quick-audio,
  .strong-quick-open {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: fit-content;
    padding: 6px 10px;
    border: 2px solid var(--border-color);
    background: var(--bg-canvas);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
  }

  .strong-quick-audio:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .strong-quick-fields {
    margin: 0;
    padding: 10px;
    border: 2px solid var(--border-color);
    background: var(--bg-canvas);
    display: grid;
    gap: 10px;
  }

  .strong-quick-fields dt {
    margin-bottom: 2px;
    font-family: var(--font-mono);
    font-size: 0.68rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .strong-quick-fields dd {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .strong-quick-fields dd span {
    display: block;
    margin-top: 4px;
    color: var(--text-muted);
    font-size: 0.76rem;
  }

  .strong-quick-occ,
  .strong-quick-state {
    margin: 0;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.74rem;
    font-weight: 700;
  }
</style>
