<script lang="ts">
  import { BookOpen, BookOpenText, ChevronLeft, ChevronRight, X } from 'lucide-svelte';
  import type { CommentaryEntry } from '../domain/Commentary';
  import { parseCbaText } from '../domain/cbaText';

  interface Props {
    isOpen: boolean;
    book: string;
    chapter: number;
    initialVerse?: number | null;
    entries: CommentaryEntry[];
    isLoading: boolean;
    onClose: () => void;
    onSelectPassage: (ref: string) => void;
    onPrevChapter: () => void;
    onNextChapter: () => void;
  }

  let {
    isOpen = false,
    book = '',
    chapter = 1,
    initialVerse = null,
    entries = [],
    isLoading = false,
    onClose,
    onSelectPassage,
    onPrevChapter,
    onNextChapter,
  }: Props = $props();

  let bookEntries = $derived(entries.filter((e) => e.scope === 'book' && Boolean(e.text)));
  let verseEntries = $derived(
    entries
      .filter((e) => e.scope === 'verse' && Boolean(e.text) && Number.isInteger(e.verse))
      .sort((a, b) => (a.verse || 0) - (b.verse || 0))
  );

  function scrollToVerse(verse: number, retries = 5) {
    const el = document.querySelector(`[data-cba-full-verse="${verse}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (retries > 0) {
      setTimeout(() => scrollToVerse(verse, retries - 1), 200);
    }
  }

  $effect(() => {
    if (isOpen && !isLoading && initialVerse !== null && verseEntries.length > 0) {
      const verse = initialVerse;
      const timer = setTimeout(() => scrollToVerse(verse), 120);
      return () => clearTimeout(timer);
    }
  });

  function handleReadVerse(verse: number) {
    onSelectPassage(`${book} ${chapter}:${verse}`);
    onClose();
  }
</script>

{#if isOpen}
  <div class="cba-full-backdrop" role="presentation"></div>

  <section class="cba-full-view" aria-label="Comentario Bíblico Adventista: lectura completa">
    <header class="cba-full-header">
      <div class="cba-full-title">
        <span class="cba-full-badge"><BookOpenText size={18} /></span>
        <div class="cba-full-copy">
          <h2>Comentario Bíblico Adventista</h2>
          <span>{book} {chapter}</span>
        </div>
      </div>
      <button
        type="button"
        class="cba-full-close-btn"
        onclick={onClose}
        data-tooltip="Cerrar lectura completa (Esc)"
        aria-label="Cerrar lectura completa del comentario"
      >
        <X size={18} />
      </button>
    </header>

    <nav class="cba-full-nav" aria-label="Navegación de capítulos del comentario">
      <button type="button" class="cba-full-nav-btn" onclick={onPrevChapter} data-tooltip="Capítulo anterior">
        <ChevronLeft size={16} />
        <span>Anterior</span>
      </button>
      <span class="cba-full-nav-ref">{book} {chapter}</span>
      <button type="button" class="cba-full-nav-btn" onclick={onNextChapter} data-tooltip="Siguiente capítulo">
        <span>Siguiente</span>
        <ChevronRight size={16} />
      </button>
    </nav>

    <div class="cba-full-content">
      {#if isLoading}
        <div class="cba-full-state">
          <span class="cba-full-loading-mark">…</span>
          <p>Cargando comentario de {book} {chapter}…</p>
        </div>
      {:else if verseEntries.length === 0}
        <div class="cba-full-state">
          <BookOpen size={36} />
          <p>El CBA no tiene comentarios para {book} {chapter}.</p>
          <span>Prueba con otro capítulo o libro.</span>
        </div>
      {:else}
        {#if chapter === 1 && bookEntries.length > 0}
          <div class="cba-full-intro">
            <h3>Introducción</h3>
            {#each bookEntries as intro}
              {#each intro.text.split(/\n\n+/) as paragraph}
                <p>{paragraph}</p>
              {/each}
            {/each}
          </div>
        {/if}

        <div class="cba-full-verses">
          {#each verseEntries as entry}
            {@const parsed = parseCbaText(entry.text)}
            <article
              class="cba-full-verse-card {initialVerse !== null && entry.verse === initialVerse ? 'is-targeted' : ''}"
              data-cba-full-verse={entry.verse}
            >
              <div class="cba-full-verse-header">
                <span class="cba-full-verse-badge">Versículo {entry.verse}</span>
                <button
                  type="button"
                  class="cba-full-read-btn"
                  onclick={() => handleReadVerse(entry.verse!)}
                  data-tooltip="Abrir versículo en el lector"
                >
                  <BookOpen size={13} />
                  <span>Leer versículo</span>
                </button>
              </div>
              <div class="cba-full-verse-text">
                {#if parsed.phrase}
                  <em class="cba-full-phrase">{parsed.phrase}</em>
                  <span> — {parsed.content}</span>
                {:else}
                  <span>{parsed.content}</span>
                {/if}
              </div>
              {#if parsed.refs.length > 0}
                <div class="cba-full-refs">
                  {#each parsed.refs as ref}
                    <span class="cba-full-ref-chip">{ref}</span>
                  {/each}
                </div>
              {/if}
            </article>
          {/each}
        </div>
      {/if}
    </div>
  </section>
{/if}

<style>
  .cba-full-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    z-index: 140;
  }

  .cba-full-view {
    position: fixed;
    inset: 5vh 50%;
    width: min(880px, calc(100vw - 32px));
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    background: var(--bg-surface);
    border: 3px solid var(--border-color);
    box-shadow: 8px 8px 0 var(--border-color);
    z-index: 150;
    overflow: hidden;
  }

  .cba-full-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    background: var(--accent-attention);
    border-bottom: 3px solid var(--border-color);
  }

  .cba-full-title {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    color: var(--on-accent-attention);
  }

  .cba-full-badge {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    background: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
  }

  .cba-full-copy h2 {
    margin: 0;
    color: var(--text-main);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 900;
    line-height: 1.2;
  }

  .cba-full-copy span {
    color: var(--text-main);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
  }

  .cba-full-close-btn {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    background: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
  }

  .cba-full-close-btn:hover {
    background: var(--accent-error-solid);
    color: var(--on-accent-error-solid);
  }

  .cba-full-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 16px;
    background: var(--bg-canvas);
    border-bottom: 2px solid var(--border-color);
  }

  .cba-full-nav-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    color: var(--text-main);
    background: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
  }

  .cba-full-nav-btn:hover {
    background: var(--accent-active);
    color: var(--on-accent-active);
  }

  .cba-full-nav-btn:active {
    transform: translate(2px, 2px);
    box-shadow: var(--shadow-active);
  }

  .cba-full-nav-ref {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 900;
  }

  .cba-full-content {
    padding: 16px;
    overflow-y: auto;
    max-height: calc(90vh - 150px);
  }

  .cba-full-intro {
    margin-bottom: 20px;
    padding: 16px;
    background: var(--bg-canvas);
    border: 2px solid var(--border-color);
    box-shadow: 4px 4px 0 var(--border-color);
  }

  .cba-full-intro h3 {
    margin: 0 0 10px;
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 900;
  }

  .cba-full-intro p {
    margin: 0 0 12px;
    font-family: var(--font-serif, Georgia, serif);
    font-size: 0.9375rem;
    line-height: 1.65;
  }

  .cba-full-intro p:last-child {
    margin-bottom: 0;
  }

  .cba-full-verses {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .cba-full-verse-card {
    padding: 14px;
    background: var(--bg-canvas);
    border: 2px solid var(--border-color);
    box-shadow: 3px 3px 0 var(--border-color);
    scroll-margin-top: 12px;
  }

  .cba-full-verse-card.is-targeted {
    background: var(--accent-attention);
    color: var(--on-accent-attention);
    box-shadow: 4px 4px 0 var(--border-color);
  }

  .cba-full-verse-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px dashed var(--border-color);
  }

  .cba-full-verse-badge {
    padding: 2px 8px;
    color: var(--on-accent-attention);
    background: var(--accent-attention);
    border: 1.5px solid var(--border-color);
    box-shadow: 1.5px 1.5px 0 var(--border-color);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 900;
  }

  .cba-full-verse-card.is-targeted .cba-full-verse-badge {
    background: var(--bg-surface);
  }

  .cba-full-read-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 7px;
    color: var(--text-main);
    background: var(--bg-surface);
    border: 1.5px solid var(--border-color);
    box-shadow: 1.5px 1.5px 0 var(--border-color);
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.625rem;
    font-weight: 800;
  }

  .cba-full-read-btn:hover {
    background: var(--accent-active);
    color: var(--on-accent-active);
  }

  .cba-full-verse-text {
    color: var(--text-main);
    font-family: var(--font-serif, Georgia, serif);
    font-size: 0.9375rem;
    line-height: 1.65;
    white-space: pre-line;
  }

  .cba-full-phrase {
    color: var(--text-main);
    font-weight: 700;
  }

  .cba-full-refs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px dashed var(--border-color);
  }

  .cba-full-ref-chip {
    padding: 1px 7px;
    color: var(--text-muted);
    background: var(--bg-surface);
    border: 1px solid var(--border-color);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
  }

  .cba-full-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 220px;
    gap: 8px;
    color: var(--text-muted);
    text-align: center;
  }

  .cba-full-state p {
    margin: 0;
    color: var(--text-main);
    font-size: 0.875rem;
    font-weight: 800;
  }

  .cba-full-state span {
    font-size: 0.75rem;
  }

  .cba-full-loading-mark {
    font-family: var(--font-mono);
    font-size: 2rem;
    font-weight: 900;
  }

  @media (max-width: 640px) {
    .cba-full-view {
      inset: 3vh 8px auto;
      width: auto;
      transform: none;
    }

    .cba-full-content {
      max-height: calc(94vh - 150px);
    }

    .cba-full-verse-header {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
