<script lang="ts">
  import { onMount } from 'svelte';
  import { ChevronLeft, ChevronRight, Search, Volume2, VolumeX, X } from 'lucide-svelte';
  import type { StrongEntry, StrongTestament } from '../domain/StrongEntry';
  import { STRONG_RANGES, matchesStrongQuery, normalizeStrongId } from '../domain/StrongEntry';
  import { JsonStrongRepository } from '../infrastructure/JsonStrongRepository';
  import { OccurrencesRepository, type StrongOccurrences } from '../infrastructure/OccurrencesRepository';
  import { findBookInfo } from '../../bible-reader/domain/entities/BibleBooks';

  interface Props {
    initialId?: string | null;
    onSelectPassage?: (ref: string) => void;
  }

  let { initialId = null, onSelectPassage }: Props = $props();

  const strongRepo = new JsonStrongRepository();
  const occurrencesRepo = new OccurrencesRepository();
  const ITEMS_PER_PAGE = 15;
  const OCC_PREVIEW = 30;

  let allEntries = $state<StrongEntry[]>([]);
  let isLoading = $state(true);
  let loadError = $state(false);
  let testament = $state<StrongTestament>('hebrew');
  let query = $state('');
  let currentPage = $state(1);
  let selectedId = $state<string | null>(null);
  let audioMissingIds = $state<string[]>([]);
  let isPlayingId = $state<string | null>(null);
  let occurrences = $state<StrongOccurrences | null>(null);
  let occurrencesLoading = $state(false);
  let occurrencesShown = $state(OCC_PREVIEW);

  $effect(() => {
    const id = selectedId;
    occurrences = null;
    occurrencesShown = OCC_PREVIEW;
    if (!id) return;
    occurrencesLoading = true;
    occurrencesRepo.get(id).then((occ) => {
      if (selectedId === id) occurrences = occ;
    }).finally(() => {
      if (selectedId === id) occurrencesLoading = false;
    });
  });

  function occurrenceLabel(ref: string): string {
    const [code, cv] = ref.split(' ');
    const info = findBookInfo(code);
    return info ? `${info.name} ${cv}` : ref;
  }

  function openOccurrence(ref: string) {
    onSelectPassage?.(occurrenceLabel(ref));
  }

  let testamentEntries = $derived(allEntries.filter((e) => e.testament === testament));
  let filteredEntries = $derived(
    query.trim()
      ? testamentEntries.filter((e) => matchesStrongQuery(e, query))
      : testamentEntries
  );
  let totalPages = $derived(Math.max(1, Math.ceil(filteredEntries.length / ITEMS_PER_PAGE)));
  let safePage = $derived(Math.min(currentPage, totalPages));
  let paginatedEntries = $derived(
    filteredEntries.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)
  );
  let selectedEntry = $derived(
    selectedId ? (allEntries.find((e) => e.id === selectedId) || null) : null
  );

  function selectTestament(next: StrongTestament) {
    testament = next;
    query = '';
    currentPage = 1;
    selectedId = null;
  }

  function handleQueryInput(value: string) {
    query = value;
    currentPage = 1;
  }

  function handleSearchSubmit(event: Event) {
    event.preventDefault();
    const directId = normalizeStrongId(query);
    if (directId && allEntries.some((e) => e.id === directId)) {
      const target = allEntries.find((e) => e.id === directId)!;
      if (target.testament !== testament) testament = target.testament;
      query = '';
      currentPage = 1;
      selectedId = directId;
    }
  }

  function openDetail(id: string) {
    selectedId = id;
  }

  function closeDetail() {
    selectedId = null;
  }

  function stepDetail(delta: -1 | 1) {
    if (!selectedEntry) return;
    const target = selectedEntry.number + delta;
    const max = STRONG_RANGES[selectedEntry.testament].max;
    if (target < 1 || target > max) return;
    const prefix = selectedEntry.testament === 'greek' ? 'G' : 'H';
    const nextId = `${prefix}${target}`;
    if (allEntries.some((e) => e.id === nextId)) selectedId = nextId;
  }

  async function playAudio(entry: StrongEntry) {
    if (audioMissingIds.includes(entry.id)) return;
    try {
      isPlayingId = entry.id;
      const audio = new Audio(entry.audioPath);
      await audio.play();
      audio.onended = () => {
        if (isPlayingId === entry.id) isPlayingId = null;
      };
    } catch {
      if (!audioMissingIds.includes(entry.id)) audioMissingIds = [...audioMissingIds, entry.id];
      isPlayingId = null;
    }
  }

  onMount(async () => {
    try {
      allEntries = await strongRepo.getAll();
      if (allEntries.length === 0) loadError = true;
      if (initialId) {
        const normalized = initialId.trim().toUpperCase();
        const target = allEntries.find((e) => e.id === normalized);
        if (target) {
          testament = target.testament;
          selectedId = target.id;
        }
      }
    } catch {
      loadError = true;
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="strong-view">
  {#if selectedEntry}
    {@const entry = selectedEntry}
    {@const isHebrew = entry.testament === 'hebrew'}
    <div class="strong-detail">
      <div class="strong-detail-topbar">
        <button type="button" class="strong-nav-btn" onclick={() => stepDetail(-1)} data-tooltip="Entrada anterior">
          <ChevronLeft size={16} />
          <span>Anterior</span>
        </button>
        <button
          type="button"
          class="strong-back-btn"
          onclick={closeDetail}
          data-tooltip="Volver al diccionario"
        >
          <X size={15} />
          <span>Diccionario</span>
        </button>
        <button type="button" class="strong-nav-btn" onclick={() => stepDetail(1)} data-tooltip="Entrada siguiente">
          <span>Siguiente</span>
          <ChevronRight size={16} />
        </button>
      </div>

      <div class="strong-word-card">
        <span class="strong-id-badge">Strong {isHebrew ? 'hebreo' : 'griego'} #{entry.number}</span>
        <p class="strong-word" dir={isHebrew ? 'rtl' : 'ltr'} lang={isHebrew ? 'he' : 'el'}>
          {entry.word}
        </p>
        <p class="strong-pronunciation">{entry.pronunciation}</p>
        <button
          type="button"
          class="strong-audio-btn"
          disabled={audioMissingIds.includes(entry.id)}
          onclick={() => playAudio(entry)}
          data-tooltip={audioMissingIds.includes(entry.id)
            ? 'Audio no disponible para esta entrada'
            : `Escuchar pronunciación (${entry.id})`}
          aria-label="Escuchar pronunciación"
        >
          {#if audioMissingIds.includes(entry.id)}
            <VolumeX size={18} />
            <span>Sin audio</span>
          {:else}
            <Volume2 size={18} />
            <span>{isPlayingId === entry.id ? 'Reproduciendo…' : 'Escuchar'}</span>
          {/if}
        </button>
      </div>

      <dl class="strong-fields">
        <div class="strong-field">
          <dt>Pronunciación</dt>
          <dd>{entry.pronunciation || '—'}</dd>
        </div>
        <div class="strong-field">
          <dt>Derivación</dt>
          <dd>{entry.derivation || '—'}</dd>
        </div>
        <div class="strong-field">
          <dt>Definición</dt>
          <dd>{entry.definition || '—'}</dd>
        </div>
        <div class="strong-field">
          <dt>Def. en RV</dt>
          <dd>{entry.rvDefinition || '—'}</dd>
        </div>
      </dl>

      <div class="strong-occurrences">
        <h3>
          Aparece en
          {#if occurrencesLoading}
            … buscando
          {:else if occurrences}
            {occurrences.n.toLocaleString('es-CL')} {occurrences.n === 1 ? 'versículo' : 'versículos'}
          {/if}
        </h3>
        {#if occurrences && occurrences.refs.length > 0}
          <div class="strong-occ-list">
            {#each occurrences.refs.slice(0, occurrencesShown) as ref}
              <button type="button" class="strong-occ-ref" onclick={() => openOccurrence(ref)}>
                {occurrenceLabel(ref)}
              </button>
            {/each}
          </div>
          {#if occurrences.refs.length > occurrencesShown}
            <button
              type="button"
              class="strong-occ-more"
              onclick={() => (occurrencesShown += OCC_PREVIEW)}
            >
              Ver más ({occurrences.refs.length - occurrencesShown} restantes)
            </button>
          {/if}
        {:else if !occurrencesLoading}
          <p class="strong-occ-empty">Sin ocurrencias registradas en el interlineal.</p>
        {/if}
      </div>
    </div>
  {:else}
    <div class="strong-dict-header">
      <div class="strong-dict-titles">
        <h2>Diccionario Strong</h2>
        <span>
          {filteredEntries.length.toLocaleString('es-CL')} entradas ·
          {isLoading ? 'cargando…' : `página ${safePage}/${totalPages}`}
        </span>
      </div>
      <div class="strong-testament-tabs" role="tablist" aria-label="Testamento del diccionario">
        <button
          type="button"
          role="tab"
          aria-selected={testament === 'hebrew'}
          class="strong-tab {testament === 'hebrew' ? 'is-active' : ''}"
          onclick={() => selectTestament('hebrew')}
        >
          Hebreo (H)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={testament === 'greek'}
          class="strong-tab {testament === 'greek' ? 'is-active' : ''}"
          onclick={() => selectTestament('greek')}
        >
          Griego (G)
        </button>
      </div>
    </div>

    <form class="search-form strong-search-form" role="search" onsubmit={handleSearchSubmit}>
      <div class="search-input-wrapper">
        <Search size={18} class="search-icon" />
        <input
          type="search"
          value={query}
          oninput={(e) => handleQueryInput((e.target as HTMLInputElement).value)}
          placeholder="Buscar por código (H25, G26), palabra o definición…"
          aria-label="Buscar en el diccionario Strong"
        />
      </div>
      <button type="submit">Buscar</button>
    </form>

    {#if isLoading}
      <div class="strong-state">
        <span class="strong-loading-mark">…</span>
        <p>Cargando diccionario Strong…</p>
      </div>
    {:else if loadError || allEntries.length === 0}
      <div class="strong-state">
        <p>No se pudo cargar el diccionario.</p>
        <span>Revisa que los datos estén disponibles e intenta de nuevo.</span>
      </div>
    {:else if filteredEntries.length === 0}
      <div class="strong-state">
        <p>Sin resultados para “{query}”.</p>
        <button type="button" onclick={() => handleQueryInput('')}>Limpiar búsqueda</button>
      </div>
    {:else}
      <div class="strong-pager">
        <button
          type="button"
          class="strong-nav-btn"
          disabled={safePage <= 1}
          onclick={() => (currentPage = safePage - 1)}
        >
          <ChevronLeft size={15} />
          <span>Anterior</span>
        </button>
        <span class="strong-page-label">{safePage} / {totalPages}</span>
        <button
          type="button"
          class="strong-nav-btn"
          disabled={safePage >= totalPages}
          onclick={() => (currentPage = safePage + 1)}
        >
          <span>Siguiente</span>
          <ChevronRight size={15} />
        </button>
      </div>

      <ul class="strong-list">
        {#each paginatedEntries as item (item.id)}
          <li class="strong-row">
            <button type="button" class="strong-row-main" onclick={() => openDetail(item.id)}>
              <span class="strong-row-id">{item.number}</span>
              <span
                class="strong-row-word"
                dir={testament === 'hebrew' ? 'rtl' : 'ltr'}
                lang={testament === 'hebrew' ? 'he' : 'el'}
              >
                {item.word}
              </span>
              <span class="strong-row-meta">
                <em>{item.pronunciation}</em>
                <span class="strong-row-def">{item.definition}</span>
              </span>
            </button>
            <button
              type="button"
              class="strong-row-audio"
              disabled={audioMissingIds.includes(item.id)}
              onclick={() => playAudio(item)}
              data-tooltip={audioMissingIds.includes(item.id) ? 'Sin audio' : `Escuchar ${item.id}`}
              aria-label="Escuchar pronunciación de {item.id}"
            >
              {#if audioMissingIds.includes(item.id)}
                <VolumeX size={16} />
              {:else}
                <Volume2 size={16} />
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .strong-view {
    width: 100%;
    min-width: 0;
  }

  .strong-dict-header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .strong-dict-titles h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.375rem;
    font-weight: 900;
  }

  .strong-dict-titles span {
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 700;
  }

  .strong-testament-tabs {
    display: flex;
    border: 2px solid var(--border-color);
    box-shadow: 3px 3px 0 var(--border-color);
  }

  .strong-tab {
    padding: 8px 14px;
    background: var(--bg-surface);
    border: 0;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
  }

  .strong-tab + .strong-tab {
    border-left: 2px solid var(--border-color);
  }

  .strong-tab.is-active {
    background: var(--accent-attention);
    color: var(--on-accent-attention);
  }

  .strong-search-form {
    margin-bottom: 14px;
  }

  .strong-pager {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
  }

  .strong-page-label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
  }

  .strong-nav-btn,
  .strong-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 11px;
    color: var(--text-main);
    background: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
  }

  .strong-nav-btn:hover:not(:disabled),
  .strong-back-btn:hover {
    background: var(--accent-active);
    color: var(--on-accent-active);
  }

  .strong-nav-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }

  .strong-nav-btn:active:not(:disabled),
  .strong-back-btn:active {
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 var(--border-color);
  }

  .strong-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .strong-row {
    display: flex;
    gap: 8px;
    align-items: stretch;
    background: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 3px 3px 0 var(--border-color);
  }

  .strong-row-main {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: 10px 12px;
    background: none;
    border: 0;
    cursor: pointer;
    text-align: left;
  }

  .strong-row-main:hover .strong-row-id {
    background: var(--accent-active);
    color: var(--on-accent-active);
  }

  .strong-row-id {
    flex-shrink: 0;
    min-width: 52px;
    padding: 3px 6px;
    text-align: center;
    background: var(--accent-attention);
    color: var(--on-accent-attention);
    border: 1.5px solid var(--border-color);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 900;
  }

  .strong-row-word {
    flex-shrink: 0;
    min-width: 72px;
    font-family: 'Noto Sans Hebrew', 'Segoe UI', Georgia, serif;
    font-size: 1.375rem;
    font-weight: 700;
  }

  .strong-row-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 2px;
  }

  .strong-row-meta em {
    font-size: 0.8125rem;
    font-weight: 700;
  }

  .strong-row-def {
    overflow: hidden;
    color: var(--text-muted);
    font-size: 0.8125rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .strong-row-audio {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 44px;
    margin: 8px 8px 8px 0;
    background: var(--bg-canvas);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
  }

  .strong-row-audio:hover:not(:disabled) {
    background: var(--accent-attention);
    color: var(--on-accent-attention);
  }

  .strong-row-audio:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
  }

  .strong-detail-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 14px;
  }

  .strong-word-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 22px 16px;
    text-align: center;
    background: var(--bg-surface);
    border: 3px solid var(--border-color);
    box-shadow: 5px 5px 0 var(--border-color);
  }

  .strong-id-badge {
    padding: 3px 10px;
    background: var(--accent-attention);
    color: var(--on-accent-attention);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 900;
  }

  .strong-word {
    margin: 0;
    font-family: 'Noto Sans Hebrew', 'Segoe UI', Georgia, serif;
    font-size: 3rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .strong-pronunciation {
    margin: 0;
    font-size: 1.125rem;
    font-style: italic;
    opacity: 0.75;
  }

  .strong-audio-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 16px;
    color: var(--on-accent-attention);
    background: var(--accent-attention);
    border: 2px solid var(--border-color);
    box-shadow: 3px 3px 0 var(--border-color);
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 900;
  }

  .strong-audio-btn:hover:not(:disabled) {
    background: var(--accent-error-solid);
    color: var(--on-accent-error-solid);
  }

  .strong-audio-btn:active:not(:disabled) {
    transform: translate(3px, 3px);
    box-shadow: var(--shadow-active);
  }

  .strong-audio-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }

  .strong-fields {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 16px 0 0;
    padding: 0;
  }

  .strong-field {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 12px;
    align-items: start;
    padding: 12px 14px;
    background: var(--bg-canvas);
    border: 2px solid var(--border-color);
    box-shadow: 3px 3px 0 var(--border-color);
  }

  .strong-field dt {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .strong-occurrences {
    margin: 16px 0 0;
    padding: 12px 14px;
    background: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 3px 3px 0 var(--border-color);
  }

  .strong-occurrences h3 {
    margin: 0 0 10px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .strong-occ-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .strong-occ-ref {
    padding: 3px 8px;
    color: var(--text-main);
    background: var(--bg-canvas);
    border: 1.5px solid var(--border-color);
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 800;
  }

  .strong-occ-ref:hover {
    background: var(--accent-active);
    color: var(--on-accent-active);
  }

  .strong-occ-more {
    margin-top: 10px;
    padding: 5px 10px;
    color: var(--text-main);
    background: none;
    border: 1.5px dashed var(--border-color);
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 800;
  }

  .strong-occ-empty {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.8125rem;
  }

  .strong-field dd {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.6;
  }

  .strong-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    gap: 8px;
    color: var(--text-muted);
    text-align: center;
  }

  .strong-state p {
    margin: 0;
    color: var(--text-main);
    font-size: 0.875rem;
    font-weight: 800;
  }

  .strong-state button {
    margin-top: 4px;
    padding: 6px 12px;
    color: var(--on-accent-attention);
    background: var(--accent-attention);
    border: 1.5px solid var(--border-color);
    box-shadow: 1.5px 1.5px 0 var(--border-color);
    cursor: pointer;
    font-weight: 800;
  }

  .strong-loading-mark {
    font-family: var(--font-mono);
    font-size: 2rem;
    font-weight: 900;
  }

  @media (max-width: 640px) {
    .strong-row-def {
      white-space: normal;
    }

    .strong-field {
      grid-template-columns: 1fr;
      gap: 4px;
    }

    .strong-word {
      font-size: 2.25rem;
    }
  }
</style>
