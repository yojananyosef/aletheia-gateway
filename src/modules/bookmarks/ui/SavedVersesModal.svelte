<script lang="ts">
  import { onMount } from 'svelte';
  import {
    X,
    Bookmark,
    Search,
    BookOpen,
    Copy,
    Trash2,
    Check,
    ArrowRight,
    Sparkles,
  } from 'lucide-svelte';
  import type { Bookmark as BookmarkEntity } from '../domain/Bookmark';
  import { LocalStorageBookmarkRepository } from '../infrastructure/LocalStorageBookmarkRepository';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelectPassage: (ref: string) => void;
    onBookmarksChange?: () => void;
  }

  let {
    isOpen = false,
    onClose,
    onSelectPassage,
    onBookmarksChange,
  }: Props = $props();

  const bookmarkRepo = new LocalStorageBookmarkRepository();

  let bookmarks = $state<BookmarkEntity[]>([]);
  let filterText = $state('');
  let copiedId = $state<string | null>(null);

  async function loadBookmarks() {
    try {
      bookmarks = await bookmarkRepo.getAll();
      onBookmarksChange?.();
    } catch (err) {
      console.error('Error loading bookmarks:', err);
    }
  }

  $effect(() => {
    if (isOpen) {
      loadBookmarks();
      filterText = '';
    }
  });

  let filteredList = $derived(
    filterText.trim()
      ? bookmarks.filter(
          (b) =>
            b.reference.toLowerCase().includes(filterText.toLowerCase().trim()) ||
            b.book.toLowerCase().includes(filterText.toLowerCase().trim()) ||
            (b.previewText && b.previewText.toLowerCase().includes(filterText.toLowerCase().trim()))
        )
      : bookmarks
  );

  async function handleDelete(id: string) {
    try {
      await bookmarkRepo.remove(id);
      await loadBookmarks();
    } catch (err) {
      console.error('Error deleting bookmark:', err);
    }
  }

  async function handleCopy(b: BookmarkEntity) {
    const textToCopy = `"${b.previewText}" — ${b.reference} (${b.translationId || 'RV1909'})`;
    await navigator.clipboard.writeText(textToCopy);
    copiedId = b.id;
    setTimeout(() => {
      if (copiedId === b.id) {
        copiedId = null;
      }
    }, 1500);
  }

  function handleGoToPassage(reference: string) {
    onSelectPassage(reference);
    onClose();
  }

  function formatDate(date: Date | string): string {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat('es', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return '';
    }
  }
</script>

{#if isOpen}
  <div
    class="book-modal-backdrop"
    role="presentation"
    onclick={onClose}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  >
    <div
      class="saved-verses-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-verses-title"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div class="saved-verses-header">
        <div class="flex items-center gap-2">
          <Bookmark size={20} class="text-[#1a1a18]" />
          <h2 id="saved-verses-title" class="font-display font-extrabold text-lg uppercase tracking-tight">
            Versículos Guardados
          </h2>
          <span class="saved-count-badge">{bookmarks.length}</span>
        </div>

        <div class="flex items-center gap-3">
          {#if bookmarks.length > 0}
            <div class="book-search-input">
              <Search size={14} class="text-black shrink-0" />
              <input
                type="text"
                placeholder="Buscar en guardados..."
                value={filterText}
                oninput={(e) => (filterText = (e.target as HTMLInputElement).value)}
              />
              {#if filterText}
                <button
                  type="button"
                  class="clear-filter-btn"
                  data-tooltip="Limpiar filtro"
                  onclick={() => (filterText = '')}
                >
                  <X size={12} />
                </button>
              {/if}
            </div>
          {/if}

          <button
            type="button"
            class="modal-close-btn"
            data-tooltip="Cerrar (Esc)"
            aria-label="Cerrar modal"
            onclick={onClose}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="saved-verses-body">
        {#if bookmarks.length === 0}
          <div class="saved-empty-state">
            <div class="empty-icon-box">
              <Bookmark size={32} />
            </div>
            <h3 class="font-display font-bold text-base mt-2">No tienes versículos guardados aún</h3>
            <p class="text-sm text-[var(--text-muted)] max-w-[420px] text-center mt-1">
              Cuando leas la Biblia, selecciona cualquier versículo o texto y pulsa el botón de marcador
              <Bookmark size={14} class="inline align-baseline text-[#1a1a18]" /> para guardarlo aquí y revisarlo cuando quieras.
            </p>
          </div>
        {:else if filteredList.length === 0}
          <div class="saved-empty-state">
            <p class="text-sm text-[var(--text-muted)]">
              No se encontraron versículos guardados para "<strong>{filterText}</strong>".
            </p>
          </div>
        {:else}
          <div class="saved-verses-list">
            {#each filteredList as b (b.id)}
              <article class="saved-verse-card">
                <div class="saved-card-top">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="saved-ref-tag">{b.reference}</span>
                    <span class="saved-version-tag">{b.translationId || 'RV1909'}</span>
                    <span class="saved-date-text">{formatDate(b.createdAt)}</span>
                  </div>

                  <div class="flex items-center gap-1.5 ml-auto">
                    <button
                      type="button"
                      class="saved-action-icon-btn"
                      data-tooltip="Copiar cita"
                      onclick={() => handleCopy(b)}
                    >
                      {#if copiedId === b.id}
                        <Check size={14} class="text-green-600" />
                      {:else}
                        <Copy size={14} />
                      {/if}
                    </button>

                    <button
                      type="button"
                      class="saved-action-icon-btn text-[var(--accent-error)] hover:bg-[var(--accent-error)] hover:text-white"
                      data-tooltip="Eliminar de guardados"
                      onclick={() => handleDelete(b.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {#if b.previewText}
                  <blockquote class="saved-card-quote">
                    “{b.previewText}”
                  </blockquote>
                {/if}

                <div class="saved-card-footer">
                  <button
                    type="button"
                    class="saved-read-btn"
                    data-tooltip="Abrir en el lector bíblico"
                    onclick={() => handleGoToPassage(b.reference)}
                  >
                    <BookOpen size={15} />
                    <span>Leer pasaje completo</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .saved-verses-dialog {
    width: min(100%, 720px);
    max-height: 84vh;
    border: var(--border-main);
    border-radius: var(--radius-strict);
    background-color: var(--bg-canvas);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: popIn 0.12s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .saved-verses-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 18px;
    border-bottom: var(--border-main);
    background-color: var(--accent-attention);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .saved-count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 6px;
    background-color: #fff;
    border: 1.5px solid var(--border-color);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
  }

  .saved-verses-body {
    flex: 1;
    overflow-y: auto;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scrollbar-width: thin;
    scrollbar-color: var(--accent-attention) var(--bg-canvas);
  }

  .saved-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 20px;
    border: 2px dashed var(--border-color);
    background-color: var(--bg-surface);
    text-align: center;
  }

  .empty-icon-box {
    display: grid;
    place-items: center;
    width: 60px;
    height: 60px;
    background-color: var(--accent-attention);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
  }

  .saved-verses-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .saved-verse-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    border: var(--border-main);
    background-color: var(--bg-surface);
    box-shadow: var(--shadow-sm);
    transition: transform 0.08s ease, box-shadow 0.08s ease;
  }

  .saved-verse-card:hover {
    transform: translate(-1px, -1px);
    box-shadow: var(--shadow-md);
  }

  .saved-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .saved-ref-tag {
    font-family: var(--font-body);
    font-size: 0.9375rem;
    font-weight: 900;
    color: var(--text-main);
  }

  .saved-version-tag {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 800;
    padding: 1px 6px;
    background-color: var(--accent-interest);
    border: 1px solid var(--border-color);
  }

  .saved-date-text {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    color: var(--text-muted);
  }

  .saved-action-icon-btn {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--border-color);
    background-color: var(--bg-surface);
    cursor: pointer;
    transition: all 0.08s ease;
  }

  .saved-action-icon-btn:hover {
    background-color: var(--accent-attention);
    box-shadow: 1.5px 1.5px 0 var(--border-color);
  }

  .saved-card-quote {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 0.9375rem;
    line-height: 1.55;
    color: var(--text-main);
    border-left: 3px solid var(--accent-attention);
    padding-left: 12px;
  }

  .saved-card-footer {
    display: flex;
    align-items: center;
    margin-top: 2px;
  }

  .saved-read-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border: 1.5px solid var(--border-color);
    background-color: var(--accent-attention);
    color: var(--text-main);
    font-family: var(--font-body);
    font-size: 0.8125rem;
    font-weight: 800;
    box-shadow: 1.5px 1.5px 0 var(--border-color);
    cursor: pointer;
    transition: all 0.08s ease;
  }

  .saved-read-btn:hover {
    background-color: var(--accent-interest);
    transform: translate(-1px, -1px);
    box-shadow: 2px 2px 0 var(--border-color);
  }

  .saved-read-btn:active {
    transform: translate(1.5px, 1.5px);
    box-shadow: 0 0 0 #000;
  }
</style>
