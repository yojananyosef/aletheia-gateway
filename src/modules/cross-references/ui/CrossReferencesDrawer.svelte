<script lang="ts">
  import { X, ExternalLink, Link2, Search } from 'lucide-svelte';
  import type { CrossReferenceClause } from '../domain/CrossReference';
  import { findBookInfo } from '../../bible-reader/domain/entities/BibleBooks';

  interface Props {
    isOpen: boolean;
    reference: string;
    book: string;
    chapter: number;
    verseNumber?: number;
    clauses: CrossReferenceClause[];
    scope?: 'verse' | 'chapter';
    chapterReferences?: Record<number, CrossReferenceClause[]>;
    onClose: () => void;
    onSelectPassage: (ref: string) => void;
  }

  type DisplayClause = CrossReferenceClause & {
    verseNumber?: number;
  };

  let {
    isOpen = false,
    reference = '',
    book = '',
    chapter = 1,
    verseNumber = 1,
    clauses = [],
    scope = 'verse',
    chapterReferences = {},
    onClose,
    onSelectPassage,
  }: Props = $props();

  let filterTerm = $state('');

  let displayClauses = $derived.by<DisplayClause[]>(() => {
    if (scope !== 'chapter') return clauses;

    return Object.entries(chapterReferences)
      .sort(([a], [b]) => Number(a) - Number(b))
      .flatMap(([verseKey, verseClauses]) =>
        verseClauses.map((clause) => ({
          ...clause,
          verseNumber: Number(verseKey),
        }))
      );
  });

  let totalRefsCount = $derived(
    displayClauses.reduce((acc, c) => acc + (c.refs ? c.refs.length : 0), 0)
  );

  let filteredClauses = $derived.by(() => {
    const term = filterTerm.trim().toLowerCase();
    if (!term) return displayClauses;

    return displayClauses
      .map((c) => {
        const matchClause = c.clause.toLowerCase().includes(term);
        const matchedRefs = c.refs.filter((r) => r.toLowerCase().includes(term));
        if (matchClause) return c;
        if (matchedRefs.length > 0) {
          return { ...c, refs: matchedRefs };
        }
        return null;
      })
      .filter((c): c is DisplayClause => c !== null);
  });

  $effect(() => {
    scope;
    reference;
    filterTerm = '';
  });

  function normalizeTskReference(ref: string): string {
    const clean = ref.trim().replace(/\s+/g, ' ');

    // Las comas después de ':' separan versículos y deben conservarse.
    if (clean.includes(':')) return clean;

    const match = clean.match(/^(.+?)\s+(\d+(?:\s*[-,]\s*\d+)*)$/);
    if (!match) return clean;

    const bookName = match[1].trim();
    const chapterList = match[2];
    const bookInfo = findBookInfo(bookName);
    if (!bookInfo || !/[,-]/.test(chapterList)) return clean;

    const chapterTokens = chapterList.split(',').map((part) => part.trim());
    const chapterRanges = chapterTokens.map((chapter) => {
      const range = chapter.match(/^(\d+)\s*-\s*(\d+)$/);
      return range
        ? { start: Number(range[1]), end: Number(range[2]) }
        : { start: Number(chapter), end: Number(chapter) };
    });

    const isChapterList = chapterRanges.every(({ start, end }) =>
      Number.isInteger(start) &&
      Number.isInteger(end) &&
      start > 0 &&
      end >= start &&
      end <= bookInfo.chaptersCount
    );

    // Algunos módulos TSK omiten ':' en referencias de versículos, por
    // ejemplo "1 Corintios 1,3,5,24,25". Si la lista excede los capítulos
    // disponibles, conservarla como una referencia de capítulo:versículos.
    if (!isChapterList) {
      const firstChapter = chapterTokens[0].match(/^\d+$/);
      const firstChapterNumber = firstChapter ? Number(firstChapter[0]) : 0;
      if (firstChapterNumber > 0 && firstChapterNumber <= bookInfo.chaptersCount && chapterTokens.length > 1) {
        return `${bookName} ${firstChapterNumber}:${chapterTokens.slice(1).join(',')}`;
      }
      return clean;
    }

    const chapters = chapterRanges.flatMap(({ start, end }) =>
      Array.from({ length: end - start + 1 }, (_, index) => String(start + index))
    );

    return `${bookName} ${chapters.join(';')}`;
  }

  function handlePassageClick(ref: string) {
    onSelectPassage(normalizeTskReference(ref));
  }

  function getDisplayReference(): string {
    if (reference) return reference;
    return `${book} ${chapter}${scope === 'verse' ? `:${verseNumber || 1}` : ''}`;
  }
</script>

{#if isOpen}
  <!-- Backdrop for mobile / overlay -->
  <button
    type="button"
    class="tsk-drawer-backdrop"
    onclick={onClose}
    aria-label="Cerrar panel de referencias cruzadas"
  ></button>

  <aside
    class="tsk-drawer neo-card"
    aria-label={scope === 'chapter' ? 'Referencias Cruzadas TSK del capítulo' : 'Referencias Cruzadas TSK del versículo'}
  >
    <!-- Header -->
    <div class="tsk-drawer-header">
      <div class="flex items-center gap-2 overflow-hidden">
        <span class="tsk-icon-badge">
          <Link2 size={18} />
        </span>
        <div class="flex flex-col min-w-0">
          <h2 class="tsk-title truncate">{getDisplayReference()}</h2>
          <span class="tsk-subtitle">
            Treasury of Scripture Knowledge (TSK) · {scope === 'chapter' ? 'Capítulo completo' : 'Versículo'}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        {#if totalRefsCount > 0}
          <span class="tsk-count-pill">{totalRefsCount} citas</span>
        {/if}
        <button
          type="button"
          class="neo-btn-icon"
          onclick={onClose}
          data-tooltip="Cerrar panel (Esc)"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </div>
    </div>

    <!-- Filter input if many clauses -->
    {#if displayClauses.length > 1 || totalRefsCount > 5}
      <div class="tsk-filter-bar">
        <div class="tsk-input-wrapper">
          <Search size={16} class="text-[var(--text-muted)] shrink-0" />
          <input
            type="text"
            bind:value={filterTerm}
            placeholder="Filtrar por palabra clave o libro..."
            class="tsk-filter-input"
          />
          {#if filterTerm}
            <button
              type="button"
              class="text-xs font-bold px-1 text-[var(--text-muted)] hover:text-black"
              onclick={() => (filterTerm = '')}
            >
              ✕
            </button>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Content / Clauses -->
    <div class="tsk-drawer-content">
      {#if displayClauses.length === 0}
        <div class="tsk-empty-state">
          <Link2 size={36} class="text-[var(--text-muted)] opacity-50 mb-2" />
          <p class="font-bold text-sm">No se encontraron referencias cruzadas directas</p>
          <p class="text-xs text-[var(--text-muted)] mt-1">
            {scope === 'chapter'
              ? 'Prueba seleccionando otro capítulo.'
              : 'Prueba seleccionando otro versículo del capítulo.'}
          </p>
        </div>
      {:else if filteredClauses.length === 0}
        <div class="tsk-empty-state">
          <Search size={32} class="text-[var(--text-muted)] opacity-50 mb-2" />
          <p class="font-bold text-sm">Sin coincidencias para "{filterTerm}"</p>
          <button
            type="button"
            class="neo-link-btn text-xs mt-2"
            onclick={() => (filterTerm = '')}
          >
            Limpiar filtro
          </button>
        </div>
      {:else}
        <div class="tsk-clause-list">
          {#each filteredClauses as c, idx}
            <div class="tsk-clause-card">
              <div class="tsk-clause-header">
                <span class="tsk-clause-num">#{idx + 1}</span>
                {#if scope === 'chapter' && c.verseNumber}
                  <span class="tsk-verse-pill">v. {c.verseNumber}</span>
                {/if}
                <span class="tsk-clause-name font-bold">"{c.clause}"</span>
                <span class="tsk-clause-count">({c.refs.length})</span>
              </div>
              <div class="tsk-refs-grid">
                {#each c.refs as r}
                  <button
                    type="button"
                    class="tsk-ref-chip"
                    onclick={() => handlePassageClick(r)}
                    data-tooltip="Abrir pasaje en el lector"
                  >
                    <span>{r}</span>
                    <ExternalLink size={12} class="shrink-0 opacity-70" />
                  </button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="tsk-drawer-footer">
      <span class="text-xs text-[var(--text-muted)] font-medium">
        💡 Toca cualquier cita para ir directamente al pasaje.
      </span>
    </div>
  </aside>
{/if}

<style>
  .tsk-drawer-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.45);
    z-index: 120;
    backdrop-filter: blur(2px);
    border: none;
    cursor: pointer;
  }

  .tsk-drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 440px;
    background-color: var(--bg-surface);
    border-left: var(--border-width-desktop) solid var(--border-color);
    z-index: 130;
    display: flex;
    flex-direction: column;
    box-shadow: -6px 0 0 rgba(0, 0, 0, 0.15);
    animation: slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .tsk-drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background-color: var(--accent-attention);
    border-bottom: 2px solid var(--border-color);
  }

  .tsk-icon-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background-color: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    flex-shrink: 0;
  }

  .tsk-title {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 800;
    color: var(--text-main);
    line-height: 1.2;
  }

  .tsk-subtitle {
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .tsk-count-pill {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 800;
    background-color: var(--bg-surface);
    border: 1.5px solid var(--border-color);
    padding: 2px 8px;
    box-shadow: 1.5px 1.5px 0 var(--border-color);
  }

  .tsk-filter-bar {
    padding: 10px 16px;
    background-color: var(--bg-canvas);
    border-bottom: 1.5px solid var(--border-color);
  }

  .tsk-input-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: var(--bg-surface);
    border: 2px solid var(--border-color);
    padding: 6px 10px;
    box-shadow: 2px 2px 0 var(--border-color);
  }

  .tsk-filter-input {
    flex: 1;
    font-size: 0.8125rem;
    font-weight: 600;
    border: none;
    outline: none;
    background: transparent;
    color: var(--text-main);
  }

  .tsk-drawer-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .tsk-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 48px 24px;
  }

  .tsk-clause-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .tsk-clause-card {
    background-color: var(--bg-surface);
    border: 2px solid var(--border-color);
    padding: 12px;
    box-shadow: 3px 3px 0 var(--border-color);
  }

  .tsk-clause-header {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px dashed var(--border-color);
  }

  .tsk-clause-num {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--accent-desire);
  }

  .tsk-verse-pill {
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 800;
    color: var(--text-main);
    background-color: var(--accent-interest);
    border: 1px solid var(--border-color);
    padding: 1px 5px;
  }

  .tsk-clause-name {
    font-size: 0.875rem;
    color: var(--text-main);
    flex: 1;
  }

  .tsk-clause-count {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 600;
  }

  .tsk-refs-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tsk-ref-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 8px;
    background-color: var(--bg-canvas);
    border: 1.5px solid var(--border-color);
    box-shadow: 1.5px 1.5px 0 var(--border-color);
    cursor: pointer;
    transition: all 0.1s ease;
    color: var(--text-main);
  }

  .tsk-ref-chip:hover {
    background-color: var(--accent-interest);
    transform: translate(-1px, -1px);
    box-shadow: 2.5px 2.5px 0 var(--border-color);
  }

  .tsk-ref-chip:active {
    transform: translate(1px, 1px);
    box-shadow: 0 0 0 var(--border-color);
  }

  .tsk-drawer-footer {
    padding: 10px 16px;
    background-color: var(--bg-canvas);
    border-top: 2px solid var(--border-color);
    text-align: center;
  }

  .neo-btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    background-color: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
  }

  .neo-btn-icon:hover {
    background-color: var(--accent-desire);
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--border-color);
  }

  .neo-btn-icon:active {
    transform: translate(1px, 1px);
    box-shadow: 0 0 0 var(--border-color);
  }

  .neo-link-btn {
    background: none;
    border: none;
    color: var(--text-main);
    font-weight: 700;
    text-decoration: underline;
    cursor: pointer;
  }
</style>
