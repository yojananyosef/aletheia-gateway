<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    BookOpen,
    Check,
    ChevronDown,
    ExternalLink,
    FileText,
    Search,
    X,
  } from 'lucide-svelte';
  import type { CommentaryEntry, CommentarySource } from '../domain/Commentary';

  interface Props {
    isOpen: boolean;
    reference: string;
    book: string;
    chapter: number;
    sources: CommentarySource[];
    selectedSourceId: string;
    entries: CommentaryEntry[];
    isLoading: boolean;
    onSourceChange: (sourceId: string) => void;
    onClose: () => void;
    onSelectPassage: (ref: string) => void;
  }

  let {
    isOpen = false,
    reference = '',
    book = '',
    chapter = 1,
    sources = [],
    selectedSourceId = '',
    entries = [],
    isLoading = false,
    onSourceChange,
    onClose,
    onSelectPassage,
  }: Props = $props();

  let filterTerm = $state('');
  let isSourceMenuOpen = $state(false);
  let sourceDropdownEl = $state<HTMLDivElement | null>(null);
  let selectedSource = $derived(
    sources.find((source) => source.id === selectedSourceId) || sources[0]
  );
  let displayEntries = $derived(
    entries.filter(({ text }) => Boolean(text) && !isUnavailableCommentary(text))
  );
  let filteredEntries = $derived.by(() => {
    const term = filterTerm.trim().toLowerCase();
    if (!term) return displayEntries;
    return displayEntries.filter((entry) => entry.text.toLowerCase().includes(term));
  });

  $effect(() => {
    if (!isOpen) {
      filterTerm = '';
      isSourceMenuOpen = false;
    }
  });

  function isUnavailableCommentary(text: string): boolean {
    const normalized = text.replace(/\s+/g, ' ').toLowerCase();
    return (
      normalized.includes('no commentary on these verses is yet included') ||
      normalized.includes('no commentary on this verse is yet included')
    );
  }

  function handleSourcePick(sourceId: string) {
    filterTerm = '';
    onSourceChange(sourceId);
    isSourceMenuOpen = false;
  }

  function handlePassageClick(verse: number) {
    filterTerm = '';
    onSelectPassage(`${book} ${chapter}:${verse}`);
  }

  function handleDocumentClick(event: MouseEvent) {
    if (
      isSourceMenuOpen &&
      sourceDropdownEl &&
      !sourceDropdownEl.contains(event.target as Node)
    ) {
      isSourceMenuOpen = false;
    }
  }

  onMount(() => {
    document.addEventListener('mousedown', handleDocumentClick);
  });

  onDestroy(() => {
    document.removeEventListener('mousedown', handleDocumentClick);
  });
</script>

{#if isOpen}
  <button
    type="button"
    class="commentary-drawer-backdrop"
    onclick={onClose}
    aria-label="Cerrar panel de comentarios bíblicos"
  ></button>

  <aside class="commentary-drawer" aria-label="Comentarios bíblicos">
    <div class="commentary-drawer-header">
      <div class="commentary-header-title">
        <span class="commentary-icon-badge"><FileText size={18} /></span>
        <div class="commentary-header-copy">
          <h2>{reference}</h2>
          <span>Comentarios bíblicos · Capítulo completo</span>
        </div>
      </div>
      <button
        type="button"
        class="commentary-close-btn"
        onclick={onClose}
        data-tooltip="Cerrar panel (Esc)"
        aria-label="Cerrar comentarios"
      >
        <X size={18} />
      </button>
    </div>

    <div class="commentary-source-bar">
      <label id="commentary-source-label">Fuente</label>
      <div
        class="commentary-source-dropdown {isSourceMenuOpen ? 'is-open' : ''}"
        bind:this={sourceDropdownEl}
      >
        <button
          type="button"
          class="commentary-source-trigger"
          aria-labelledby="commentary-source-label"
          aria-haspopup="listbox"
          aria-expanded={isSourceMenuOpen}
          disabled={sources.length === 0 || isLoading}
          onclick={() => (isSourceMenuOpen = !isSourceMenuOpen)}
        >
          <span class="commentary-source-trigger-copy">
            <span class="commentary-source-trigger-title">
              {selectedSource?.title || 'Selecciona una fuente'}
            </span>
            {#if selectedSource}
              <span class="commentary-source-trigger-author">{selectedSource.author}</span>
            {/if}
          </span>
          <ChevronDown size={16} class="commentary-source-chevron {isSourceMenuOpen ? 'is-rotated' : ''}" />
        </button>

        {#if isSourceMenuOpen}
          <div class="commentary-source-menu" role="listbox" tabindex="-1" aria-label="Fuentes de comentarios">
            <div class="commentary-source-menu-header">
              <span>Fuentes disponibles</span>
              <span>{sources.length}</span>
            </div>
            <div class="commentary-source-options">
              {#each sources as source (source.id)}
                <button
                  type="button"
                  role="option"
                  aria-selected={source.id === selectedSourceId}
                  class="commentary-source-option {source.id === selectedSourceId ? 'is-selected' : ''}"
                  onclick={() => handleSourcePick(source.id)}
                >
                  <span class="commentary-source-option-copy">
                    <span class="commentary-source-option-title">{source.title}</span>
                    <span class="commentary-source-option-author">{source.author}</span>
                  </span>
                  {#if source.id === selectedSourceId}
                    <Check size={15} class="shrink-0" />
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
      {#if selectedSource}
        <p>{selectedSource.description}</p>
        <div class="commentary-source-meta">
          <span>{selectedSource.totalEntries.toLocaleString('es-CL')} entradas</span>
          <span>{selectedSource.totalBooks} libros</span>
          <span>{selectedSource.license}</span>
        </div>
      {/if}
    </div>

    {#if displayEntries.length > 1}
      <form
        class="search-form commentary-filter-form"
        role="search"
        onsubmit={(event) => event.preventDefault()}
      >
        <div class="search-input-wrapper">
          <Search size={18} class="search-icon" />
          <input
            type="search"
            bind:value={filterTerm}
            placeholder="Buscar dentro de este capítulo..."
            aria-label="Buscar dentro de los comentarios del capítulo"
          />
          {#if filterTerm}
            <button
              type="button"
              class="commentary-filter-clear"
              onclick={() => (filterTerm = '')}
              aria-label="Limpiar búsqueda"
              data-tooltip="Limpiar búsqueda"
            >
              <X size={15} />
            </button>
          {/if}
        </div>
      </form>
    {/if}

    <div class="commentary-drawer-content">
      {#if isLoading}
        <div class="commentary-state">
          <span class="commentary-loading-mark">…</span>
          <p>Cargando comentarios de {book} {chapter}…</p>
        </div>
      {:else if sources.length === 0}
        <div class="commentary-state">
          <FileText size={36} />
          <p>No se pudieron cargar las fuentes.</p>
          <span>Revisa que los datos de comentarios estén disponibles.</span>
        </div>
      {:else if displayEntries.length === 0}
        <div class="commentary-state">
          <FileText size={36} />
          <p>Esta fuente no tiene comentarios para {book} {chapter}.</p>
          <span>Prueba otra fuente o cambia de capítulo.</span>
        </div>
      {:else if filteredEntries.length === 0}
        <div class="commentary-state">
          <Search size={32} />
          <p>No hay coincidencias para “{filterTerm}”.</p>
          <button type="button" onclick={() => (filterTerm = '')}>Limpiar filtro</button>
        </div>
      {:else}
        <div class="commentary-entry-list">
          {#each filteredEntries as entry}
            <article class="commentary-entry-card">
              <div class="commentary-entry-header">
                <span class="commentary-scope-badge scope-{entry.scope}">
                  {#if entry.scope === 'verse'}
                    v. {entry.verse}
                  {:else if entry.scope === 'chapter'}
                    Capítulo
                  {:else}
                    Libro
                  {/if}
                </span>
                {#if entry.scope === 'verse' && entry.verse !== undefined}
                  <button
                    type="button"
                    class="commentary-open-btn"
                    onclick={() => handlePassageClick(entry.verse!)}
                    data-tooltip="Abrir versículo en el lector"
                  >
                    <BookOpen size={13} />
                    <span>Leer versículo</span>
                    <ExternalLink size={12} />
                  </button>
                {/if}
              </div>
              <div class="commentary-entry-text">{entry.text}</div>
            </article>
          {/each}
        </div>
      {/if}
    </div>

    <div class="commentary-drawer-footer">
      <span>💡 Cambia la fuente para comparar perspectivas del mismo capítulo.</span>
    </div>
  </aside>
{/if}

<style>
  .commentary-drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(2px);
    border: 0;
    cursor: pointer;
    z-index: 120;
  }

  .commentary-drawer {
    position: fixed;
    inset: 0 0 0 auto;
    width: min(100%, 620px);
    background: var(--bg-surface);
    border-left: var(--border-width-desktop) solid var(--border-color);
    box-shadow: -6px 0 0 rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    z-index: 130;
    animation: commentary-slide-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes commentary-slide-in {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  .commentary-drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    background: var(--accent-interest);
    border-bottom: 2px solid var(--border-color);
  }

  .commentary-header-title {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .commentary-icon-badge,
  .commentary-close-btn {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    background: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
  }

  .commentary-icon-badge {
    width: 34px;
    height: 34px;
  }

  .commentary-close-btn {
    width: 32px;
    height: 32px;
    cursor: pointer;
  }

  .commentary-close-btn:hover {
    background: var(--accent-error);
    color: white;
  }

  .commentary-header-copy {
    min-width: 0;
  }

  .commentary-header-copy h2 {
    margin: 0;
    overflow: hidden;
    color: var(--text-main);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 900;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .commentary-header-copy span {
    color: var(--text-muted);
    font-size: 0.6875rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .commentary-source-bar {
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 12px 16px;
    background: var(--bg-canvas);
    border-bottom: 1.5px solid var(--border-color);
  }

  .commentary-source-bar label {
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 900;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .commentary-source-dropdown {
    position: relative;
  }

  .commentary-source-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    min-height: 46px;
    padding: 7px 10px;
    color: var(--text-main);
    background: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
    text-align: left;
  }

  .commentary-source-trigger:hover,
  .commentary-source-dropdown.is-open .commentary-source-trigger {
    background: var(--accent-interest);
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--border-color);
  }

  .commentary-source-trigger:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }

  .commentary-source-trigger-copy,
  .commentary-source-option-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .commentary-source-trigger-title {
    overflow: hidden;
    font-size: 0.8125rem;
    font-weight: 900;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .commentary-source-trigger-author,
  .commentary-source-option-author {
    overflow: hidden;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.625rem;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .commentary-source-chevron {
    flex-shrink: 0;
    transition: transform 0.1s ease;
  }

  .commentary-source-chevron.is-rotated {
    transform: rotate(180deg);
  }

  .commentary-source-menu {
    position: absolute;
    top: calc(100% + 5px);
    right: 0;
    left: 0;
    z-index: 150;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg-surface);
    border: var(--border-main);
    box-shadow: var(--shadow-lg);
  }

  .commentary-source-menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    color: var(--text-main);
    background: var(--accent-attention);
    border-bottom: 2px solid var(--border-color);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 900;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .commentary-source-menu-header span:last-child {
    color: var(--text-muted);
  }

  .commentary-source-options {
    max-height: 330px;
    overflow-y: auto;
    scrollbar-color: var(--accent-attention) var(--bg-surface);
    scrollbar-width: thin;
  }

  .commentary-source-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    padding: 9px 12px;
    color: var(--text-main);
    background: transparent;
    border: 0;
    border-bottom: 1px solid rgba(26, 26, 24, 0.1);
    cursor: pointer;
    text-align: left;
  }

  .commentary-source-option:last-child {
    border-bottom: 0;
  }

  .commentary-source-option:hover {
    background: var(--accent-attention);
  }

  .commentary-source-option.is-selected {
    background: var(--accent-interest);
    font-weight: 900;
  }

  .commentary-source-option-title {
    overflow: hidden;
    font-size: 0.75rem;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .commentary-source-option-author {
    font-size: 0.59375rem;
  }

  .commentary-filter-form {
    width: auto;
    max-width: none;
    min-height: 44px;
    margin: 10px 16px 12px;
    transition: box-shadow 0.08s ease-in-out;
  }

  .commentary-filter-form:hover {
    transform: none;
    box-shadow: var(--shadow-lg);
  }

  .commentary-filter-form .search-input-wrapper {
    height: 34px;
    gap: 6px;
    padding: 0 4px 0 8px;
  }

  .commentary-filter-form .search-input-wrapper input {
    height: 32px;
    padding: 0 8px;
    font-size: 0.875rem;
  }

  .commentary-filter-form .search-input-wrapper input[type='search']::-webkit-search-decoration,
  .commentary-filter-form .search-input-wrapper input[type='search']::-webkit-search-cancel-button,
  .commentary-filter-form .search-input-wrapper input[type='search']::-webkit-search-results-button,
  .commentary-filter-form .search-input-wrapper input[type='search']::-webkit-search-results-decoration {
    appearance: none;
    display: none;
  }

  .commentary-filter-form .commentary-filter-clear {
    display: grid;
    place-items: center;
    align-self: center;
    min-width: 0;
    min-height: 0;
    margin: 0;
    padding: 4px;
    color: var(--text-muted);
    background: transparent;
    border: 0;
    cursor: pointer;
  }

  .commentary-filter-form .commentary-filter-clear:hover {
    transform: none;
    color: var(--text-main);
    background: var(--accent-attention);
  }

  .commentary-source-bar p {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.75rem;
    line-height: 1.45;
  }

  .commentary-source-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .commentary-source-meta span {
    padding: 2px 6px;
    color: var(--text-main);
    background: var(--bg-surface);
    border: 1px solid var(--border-color);
    font-family: var(--font-mono);
    font-size: 0.625rem;
    font-weight: 800;
  }

  .commentary-drawer-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 16px;
    background: var(--bg-surface);
  }

  .commentary-entry-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .commentary-entry-card {
    padding: 14px;
    background: var(--bg-canvas);
    border: 2px solid var(--border-color);
    box-shadow: 3px 3px 0 var(--border-color);
  }

  .commentary-entry-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px dashed var(--border-color);
  }

  .commentary-scope-badge {
    padding: 2px 7px;
    color: var(--text-main);
    background: var(--accent-attention);
    border: 1.5px solid var(--border-color);
    box-shadow: 1.5px 1.5px 0 var(--border-color);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 900;
  }

  .commentary-scope-badge.scope-book {
    background: var(--accent-interest);
  }

  .commentary-open-btn {
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

  .commentary-open-btn:hover {
    background: var(--accent-interest);
    transform: translate(-1px, -1px);
  }

  .commentary-entry-text {
    margin-top: 2px;
    color: var(--text-main);
    font-family: var(--font-serif, Georgia, serif);
    font-size: 0.9375rem;
    line-height: 1.65;
    white-space: pre-line;
  }

  .commentary-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 220px;
    gap: 8px;
    color: var(--text-muted);
    text-align: center;
  }

  .commentary-state p {
    margin: 0;
    color: var(--text-main);
    font-size: 0.875rem;
    font-weight: 800;
  }

  .commentary-state span {
    font-size: 0.75rem;
  }

  .commentary-state button {
    margin-top: 3px;
    padding: 5px 9px;
    color: var(--text-main);
    background: var(--accent-attention);
    border: 1.5px solid var(--border-color);
    box-shadow: 1.5px 1.5px 0 var(--border-color);
    cursor: pointer;
    font-weight: 800;
  }

  .commentary-loading-mark {
    font-family: var(--font-mono);
    font-size: 2rem !important;
    font-weight: 900;
  }

  .commentary-drawer-footer {
    padding: 10px 16px;
    color: var(--text-muted);
    background: var(--bg-canvas);
    border-top: 2px solid var(--border-color);
    font-size: 0.6875rem;
    font-weight: 700;
    text-align: center;
  }

  @media (max-width: 640px) {
    .commentary-drawer {
      width: 100%;
    }

    .commentary-entry-header {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
