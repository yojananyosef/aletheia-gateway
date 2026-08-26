<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import {
    Search,
    X,
    Sparkles,
    BookOpen,
    ArrowRight,
    SlidersHorizontal,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Check,
  } from 'lucide-svelte';
  import {
    AVAILABLE_TRANSLATIONS,
    type TranslationId,
  } from '../../bible-reader/domain/entities/Translation';
  import { ConcordanceService } from '../application/ConcordanceService';
  import {
    POPULAR_BIBLICAL_TOPICS,
    type ConcordanceVerseMatch,
    type ConcordanceSearchResponse,
    type TestamentFilterOption,
    type ConcordanceSortOrder,
    type PopularTopic,
  } from '../domain/ConcordanceResult';
  import { parseConcordanceQuery } from '../domain/ConcordanceQuery';

  interface Props {
    initialQuery?: string;
    initialTranslation?: TranslationId;
    onSelectPassage: (ref: string) => void;
  }

  let {
    initialQuery = 'amor fe',
    initialTranslation = 'RV1909',
    onSelectPassage,
  }: Props = $props();

  const concordanceService = new ConcordanceService();
  const allTranslations = Object.values(AVAILABLE_TRANSLATIONS);

  let searchInput = $state(initialQuery);
  let activeQuery = $state(initialQuery);
  let activeTranslation = $state<TranslationId>(initialTranslation);
  let testamentFilter = $state<TestamentFilterOption>('ALL');
  let categoryFilter = $state<string | undefined>(undefined);
  let sortOrder = $state<ConcordanceSortOrder>('canonical');
  let currentPage = $state(1);
  const pageSize = 25;

  let isLoading = $state(false);
  let searchResponse = $state<ConcordanceSearchResponse>({
    query: '',
    translationId: initialTranslation,
    totalMatches: 0,
    filteredMatches: 0,
    facets: { total: 0, otCount: 0, ntCount: 0, categoryCounts: {} },
    results: [],
    searchDurationMs: 0,
  });

  async function executeSearch() {
    const trimmed = activeQuery.trim();
    if (!trimmed) {
      searchResponse = {
        query: '',
        translationId: activeTranslation,
        totalMatches: 0,
        filteredMatches: 0,
        facets: { total: 0, otCount: 0, ntCount: 0, categoryCounts: {} },
        results: [],
        searchDurationMs: 0,
      };
      return;
    }

    try {
      isLoading = true;
      const offset = (currentPage - 1) * pageSize;
      const res = await concordanceService.search({
        query: trimmed,
        translationId: activeTranslation,
        testamentFilter,
        categoryFilter,
        sortOrder,
        limit: pageSize,
        offset,
      });
      searchResponse = res;
    } catch (err) {
      console.error('Error executing concordance search:', err);
    } finally {
      isLoading = false;
    }
  }

  $effect(() => {
    const q = activeQuery;
    const t = activeTranslation;
    const tf = testamentFilter;
    const cf = categoryFilter;
    const so = sortOrder;
    const cp = currentPage;

    untrack(() => {
      executeSearch();
    });
  });

  function handleSubmit(event?: Event) {
    if (event) event.preventDefault();
    if (searchInput.trim() !== activeQuery) {
      currentPage = 1;
      activeQuery = searchInput.trim();
    }
  }

  function handleSelectTopic(topic: PopularTopic) {
    searchInput = topic.query;
    activeQuery = topic.query;
    testamentFilter = 'ALL';
    categoryFilter = undefined;
    currentPage = 1;
  }

  function handleClear() {
    searchInput = '';
    activeQuery = '';
    currentPage = 1;
  }

  function handleSelectTestament(filter: TestamentFilterOption) {
    testamentFilter = filter;
    categoryFilter = undefined;
    currentPage = 1;
  }

  function handleSelectCategory(catName?: string) {
    categoryFilter = catName;
    currentPage = 1;
  }

  function handleToggleSort() {
    sortOrder = sortOrder === 'canonical' ? 'relevance' : 'canonical';
    currentPage = 1;
  }

  function handlePrevPage() {
    if (currentPage > 1) {
      currentPage--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleNextPage() {
    const totalPages = Math.ceil(searchResponse.filteredMatches / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Highlight terms in verse text
  function highlightMatches(rawText: string, queryStr: string): string {
    if (!queryStr.trim()) return escapeHtml(rawText);

    const parsed = parseConcordanceQuery(queryStr);
    const tokens = [...parsed.exactPhrases, ...parsed.requiredWords];
    if (tokens.length === 0) return escapeHtml(rawText);

    // Create a regex that matches any of the tokens (case & accent insensitive)
    // Build normalized matching positions
    const normText = rawText
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const intervals: Array<{ start: number; end: number }> = [];

    for (const token of tokens) {
      if (!token) continue;
      let pos = 0;
      while ((pos = normText.indexOf(token, pos)) !== -1) {
        intervals.push({ start: pos, end: pos + token.length });
        pos += token.length;
      }
    }

    if (intervals.length === 0) return escapeHtml(rawText);

    intervals.sort((a, b) => a.start - b.start);
    const merged: Array<{ start: number; end: number }> = [];
    let cur = intervals[0];

    for (let i = 1; i < intervals.length; i++) {
      const next = intervals[i];
      if (next.start <= cur.end) {
        cur.end = Math.max(cur.end, next.end);
      } else {
        merged.push(cur);
        cur = next;
      }
    }
    merged.push(cur);

    let html = '';
    let lastIdx = 0;
    for (const m of merged) {
      if (m.start > lastIdx) {
        html += escapeHtml(rawText.slice(lastIdx, m.start));
      }
      html += `<mark class="concordance-highlight">${escapeHtml(rawText.slice(m.start, m.end))}</mark>`;
      lastIdx = m.end;
    }
    if (lastIdx < rawText.length) {
      html += escapeHtml(rawText.slice(lastIdx));
    }

    return html;
  }

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  let totalPages = $derived(Math.ceil(searchResponse.filteredMatches / pageSize));
  let currentTranslationMeta = $derived(
    AVAILABLE_TRANSLATIONS[activeTranslation] || AVAILABLE_TRANSLATIONS.RV1909
  );
</script>

<div class="concordance-view">
  <!-- Top Search Bar Section -->
  <section class="concordance-header-card">
    <div class="concordance-title-row">
      <div class="flex items-center gap-2">
        <span class="concordance-badge-icon">
          <Search size={18} />
        </span>
        <h1 class="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-[var(--text-main)]">
          Concordancia Bíblica
        </h1>
      </div>

      <!-- Version Selector Pill -->
      <div class="flex items-center gap-2">
        <label for="concordance-version-select" class="text-xs font-mono font-bold text-[var(--text-muted)] uppercase hidden sm:inline">
          Versión:
        </label>
        <select
          id="concordance-version-select"
          class="concordance-version-select"
          bind:value={activeTranslation}
        >
          {#each allTranslations as t}
            <option value={t.id}>{t.shortName} - {t.name}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Search Form -->
    <form class="search-form concordance-search-form" onsubmit={handleSubmit}>
      <div class="search-input-wrapper">
        <Search size={20} class="search-icon" />
        <input
          type="text"
          aria-label="Buscar palabras o temas en la concordancia"
          placeholder="Busca palabras o temas (ej. amor fe, 'reino de Dios', gracia -mundo)..."
          bind:value={searchInput}
        />
        {#if searchInput}
          <button
            type="button"
            class="clear-filter-btn"
            aria-label="Limpiar búsqueda"
            onclick={handleClear}
          >
            <X size={16} />
          </button>
        {/if}
      </div>
      <button type="submit">Buscar</button>
    </form>

    <!-- Popular Biblical Topics (Chips) -->
    <div class="popular-topics-row">
      <span class="topics-label">
        <Sparkles size={13} class="shrink-0" />
        Temas:
      </span>
      <div class="topics-chips-scroll">
        {#each POPULAR_BIBLICAL_TOPICS as topic}
          <button
            type="button"
            class="topic-chip-btn {activeQuery === topic.query ? 'is-active' : ''}"
            onclick={() => handleSelectTopic(topic)}
          >
            {topic.label}
          </button>
        {/each}
      </div>
    </div>
  </section>

  <!-- Results Section -->
  {#if activeQuery.trim()}
    <!-- Facets & Filters Toolbar -->
    <section class="concordance-toolbar-card">
      <div class="concordance-facets-row">
        <!-- Testament Chips -->
        <button
          type="button"
          class="filter-chip-btn {testamentFilter === 'ALL' && !categoryFilter ? 'is-selected' : ''}"
          onclick={() => handleSelectTestament('ALL')}
        >
          <span>Toda la Biblia</span>
          <span class="facet-count-badge">{searchResponse.facets.total}</span>
        </button>

        <button
          type="button"
          class="filter-chip-btn {testamentFilter === 'AT' && !categoryFilter ? 'is-selected' : ''}"
          onclick={() => handleSelectTestament('AT')}
        >
          <span>Antiguo T.</span>
          <span class="facet-count-badge">{searchResponse.facets.otCount}</span>
        </button>

        <button
          type="button"
          class="filter-chip-btn {testamentFilter === 'NT' && !categoryFilter ? 'is-selected' : ''}"
          onclick={() => handleSelectTestament('NT')}
        >
          <span>Nuevo T.</span>
          <span class="facet-count-badge">{searchResponse.facets.ntCount}</span>
        </button>

        <!-- Category Chips -->
        {#each Object.entries(searchResponse.facets.categoryCounts) as [catName, count]}
          {#if count > 0}
            <button
              type="button"
              class="filter-chip-btn category-chip {categoryFilter === catName ? 'is-selected' : ''}"
              onclick={() => handleSelectCategory(catName)}
            >
              <span>{catName}</span>
              <span class="facet-count-badge">{count}</span>
            </button>
          {/if}
        {/each}
      </div>

      <!-- Stats and Sort Row -->
      <div class="concordance-stats-row">
        <div class="stats-info">
          <span>Mostrando <strong>{searchResponse.filteredMatches}</strong> versículos</span>
          <span class="text-[var(--text-muted)]">en {currentTranslationMeta.shortName} ({searchResponse.searchDurationMs}ms)</span>
        </div>

        <button
          type="button"
          class="sort-toggle-btn"
          onclick={handleToggleSort}
          data-tooltip="Cambiar orden de los resultados"
        >
          <ArrowUpDown size={14} />
          <span>{sortOrder === 'canonical' ? 'Orden Bíblico' : 'Mayor Relevancia'}</span>
        </button>
      </div>
    </section>

    <!-- Verses Matches List -->
    {#if isLoading}
      <div class="concordance-loading-card">
        <span class="font-mono text-sm font-bold animate-pulse">Buscando versículos en la concordancia...</span>
      </div>
    {:else if searchResponse.results.length === 0}
      <div class="concordance-empty-card">
        <h3 class="font-display font-bold text-base mb-1">No se encontraron versículos</h3>
        <p class="text-sm text-[var(--text-muted)]">
          No hay coincidencias para <strong>"{activeQuery}"</strong> en {currentTranslationMeta.name}.
          Intenta con sinónimos o menos palabras.
        </p>
      </div>
    {:else}
      <div class="concordance-results-list">
        {#each searchResponse.results as match}
          <article class="concordance-verse-card">
            <div class="concordance-verse-header">
              <span class="verse-ref-badge">{match.reference}</span>
              <div class="flex items-center gap-2">
                <span class="verse-category-tag">{match.category}</span>
                <span class="verse-testament-tag">{match.testament}</span>
              </div>
            </div>

            <p class="concordance-verse-body">
              {@html highlightMatches(match.rawText, activeQuery)}
            </p>

            <div class="concordance-verse-footer">
              <button
                type="button"
                class="concordance-open-reader-btn"
                data-tooltip="Abrir {match.bookName} {match.chapter} en el lector bíblico"
                onclick={() => onSelectPassage(match.reference)}
              >
                <BookOpen size={14} />
                <span>Leer en el contexto</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </article>
        {/each}
      </div>

      <!-- Pagination Controls -->
      {#if totalPages > 1}
        <div class="concordance-pagination-bar">
          <button
            type="button"
            class="pagination-btn"
            disabled={currentPage <= 1}
            onclick={handlePrevPage}
          >
            <ChevronLeft size={16} />
            <span>Anterior</span>
          </button>

          <span class="font-mono text-xs font-bold">
            Página {currentPage} de {totalPages}
          </span>

          <button
            type="button"
            class="pagination-btn"
            disabled={currentPage >= totalPages}
            onclick={handleNextPage}
          >
            <span>Siguiente</span>
            <ChevronRight size={16} />
          </button>
        </div>
      {/if}
    {/if}
  {:else}
    <!-- Initial Guide / Welcome state -->
    <div class="concordance-welcome-card">
      <h2 class="font-display font-bold text-lg mb-2">Explora la Concordancia Bíblica</h2>
      <p class="text-sm text-[var(--text-muted)] mb-4">
        Escribe palabras clave o temas para encontrar al instante todos los versículos donde aparecen en cualquiera de las 9 versiones bíblicas.
      </p>

      <div class="concordance-tips-grid">
        <div class="tip-card">
          <span class="tip-badge">AND</span>
          <span class="font-bold text-xs">amor fe</span>
          <span class="text-xs text-[var(--text-muted)]">Versículos que contienen ambas palabras.</span>
        </div>
        <div class="tip-card">
          <span class="tip-badge">Frase</span>
          <span class="font-bold text-xs">"amor de Dios"</span>
          <span class="text-xs text-[var(--text-muted)]">Frase exacta entre comillas.</span>
        </div>
        <div class="tip-card">
          <span class="tip-badge">NOT</span>
          <span class="font-bold text-xs">amor -mundo</span>
          <span class="text-xs text-[var(--text-muted)]">Excluye versículos que contengan esa palabra.</span>
        </div>
      </div>
    </div>
  {/if}
</div>