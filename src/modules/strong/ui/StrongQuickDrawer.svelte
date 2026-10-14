<script lang="ts">
  import { onDestroy, onMount, tick, untrack } from 'svelte';
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
  /** Se va llenando en runtime cuando un mp3 no existe (igual que en StrongView). */
  let audioMissingIds = $state<string[]>([]);

  let closeButtonEl = $state<HTMLButtonElement | null>(null);
  let previousFocus: HTMLElement | null = null;

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
    } catch {
      if (strongId === id) {
        entry = null;
        occurrences = null;
      }
    } finally {
      if (strongId === id) isLoading = false;
    }
  }

  async function playAudio(current: StrongEntry) {
    if (audioMissingIds.includes(current.id) || isPlaying) return;
    isPlaying = true;
    try {
      const audio = new Audio(current.audioPath);
      await audio.play();
      audio.addEventListener('ended', () => (isPlaying = false), { once: true });
    } catch {
      if (!audioMissingIds.includes(current.id)) {
        audioMissingIds = [...audioMissingIds, current.id];
      }
      isPlaying = false;
    }
  }

  function handleKey(event: KeyboardEvent) {
    if (!isOpen || event.key !== 'Escape') return;
    event.stopPropagation();
    onClose();
  }

  $effect(() => {
    const id = strongId?.trim().toUpperCase() || null;
    if (isOpen && id) {
      loadStrong(id);
    } else {
      entry = null;
      occurrences = null;
      isLoading = false;
      isPlaying = false;
    }
  });

  // Al abrir, el foco entra al panel; al cerrar vuelve al término del texto hebreo
  // para no perder el punto de lectura. Los refs van en untrack porque si no el
  // efecto se dispararía dos veces (bind:this escribe después del primer render).
  $effect(() => {
    if (!isOpen) return;
    untrack(() => {
      previousFocus = (document.activeElement as HTMLElement) ?? null;
    });
    tick().then(() => untrack(() => closeButtonEl?.focus()));
    return () => {
      previousFocus?.focus?.();
      previousFocus = null;
    };
  });

  onMount(() => {
    document.addEventListener('keydown', handleKey);
  });

  onDestroy(() => {
    document.removeEventListener('keydown', handleKey);
  });
</script>

{#if isOpen}
  <button
    type="button"
    class="strong-quick-backdrop"
    onclick={onClose}
    aria-label="Cerrar panel Strong"
    tabindex="-1"
  ></button>
  <aside
    class="strong-quick-drawer neo-card"
    role="dialog"
    aria-modal="true"
    aria-label="Strong rápido"
  >
    <div class="strong-quick-header">
      <div class="strong-quick-heading">
        <h2>Strong rápido</h2>
        {#if referenceLabel}<span class="strong-quick-ref">{referenceLabel}</span>{/if}
      </div>
      <button
        type="button"
        class="neo-btn-icon"
        onclick={onClose}
        data-tooltip="Cerrar panel (Esc)"
        aria-label="Cerrar panel Strong"
        bind:this={closeButtonEl}
      >
        <X size={18} />
      </button>
    </div>

    {#if isLoading}
      <p class="strong-quick-state">Cargando…</p>
    {:else if entry}
      {@const isHebrew = entry.testament === 'hebrew'}
      {@const hasAudio = !audioMissingIds.includes(entry.id)}
      <div class="strong-quick-body">
        <span class="strong-id-badge">Strong {isHebrew ? 'hebreo' : 'griego'} #{entry.number}</span>
        <p class="strong-word" dir={isHebrew ? 'rtl' : 'ltr'} lang={isHebrew ? 'he' : 'el'}>
          {entry.word || '—'}
        </p>
        <p class="strong-pronunciation">{entry.pronunciation || '—'}</p>
        <button
          type="button"
          class="strong-audio-btn"
          disabled={!hasAudio}
          onclick={() => playAudio(entry)}
          aria-label="Escuchar pronunciación"
          data-tooltip={hasAudio ? `Escuchar ${entry.id}` : 'Sin audio'}
        >
          {#if hasAudio}
            <Volume2 size={16} /><span>{isPlaying ? 'Reproduciendo…' : 'Escuchar'}</span>
          {:else}
            <VolumeX size={16} /><span>Sin audio</span>
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

        <p class="strong-quick-occurrences">
          {#if occurrences}
            {occurrences.n.toLocaleString('es-CL')}
            {occurrences.n === 1 ? 'versículo' : 'versículos'}
          {:else}
            Sin ocurrencias registradas.
          {/if}
        </p>

        <button type="button" class="strong-quick-open" onclick={() => onOpenDictionary?.(entry!.id)}>
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
  /* Mismo nivel que los demás paneles laterales del lector (120/130): por debajo
     quedan la barra flotante de resaltado (95) y el menú de tamaños (90). */
  .strong-quick-backdrop {
    position: fixed;
    inset: 0;
    z-index: 120;
    background: rgba(0, 0, 0, 0.45);
    border: 0;
    cursor: pointer;
  }

  .strong-quick-drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 130;
    width: 100%;
    max-width: 440px;
    padding: 14px;
    background: var(--bg-surface);
    border-left: var(--border-width-desktop) solid var(--border-color);
    box-shadow: -6px 0 0 rgba(0, 0, 0, 0.15);
    overflow-y: auto;
    animation: strong-quick-slide-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes strong-quick-slide-in {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .strong-quick-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
  }

  .strong-quick-heading {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .strong-quick-heading h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 900;
  }

  .strong-quick-ref {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 700;
    opacity: 0.8;
  }

  .strong-quick-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .strong-quick-word {
    margin: 0;
    font-size: 2rem;
    font-weight: 800;
    line-height: 1.2;
  }

  .strong-pronunciation {
    margin: 0;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.8rem;
    font-weight: 700;
  }

  .strong-audio-btn,
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

  .strong-audio-btn:disabled {
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

  .strong-quick-occurrences,
  .strong-quick-state {
    margin: 0;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.74rem;
    font-weight: 700;
  }
</style>
