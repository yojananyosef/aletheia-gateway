<script lang="ts">
  import {
    Search,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    CopyPlus,
    ChevronDown,
  } from 'lucide-svelte';
  import type { TranslationId } from '../domain/entities/Translation';
  import type { PassageVersionResult } from '../domain/entities/Chapter';
  import ParallelPassageViewer from './ParallelPassageViewer.svelte';
  import BookChapterSelectorModal from './BookChapterSelectorModal.svelte';
  import FontSizeSelector, { type FontSizeOption } from './FontSizeSelector.svelte';
  import HighlightFloatingToolbar from './HighlightFloatingToolbar.svelte';

  interface Props {
    query: string;
    activeQuery: string;
    passages: PassageVersionResult[];
    selectedTranslations: TranslationId[];
    isBookmarked: boolean;
    fontSize?: FontSizeOption;
    onSearch: (event: SubmitEvent) => void;
    onQueryChange: (val: string) => void;
    onAddParallelColumn: () => void;
    onChangeColumnTranslation: (index: number, newTranslationId: TranslationId) => void;
    onRemoveColumn: (index: number) => void;
    onFontSizeChange: (size: FontSizeOption) => void;
    onSelectPassage: (ref: string) => void;
    onPrevChapter: () => void;
    onNextChapter: () => void;
    onToggleBookmark: () => void;
  }

  let {
    query = '',
    activeQuery = 'Génesis 1:1',
    passages = [],
    selectedTranslations = ['RVC'],
    fontSize = 'medium',
    onSearch,
    onQueryChange,
    onAddParallelColumn,
    onChangeColumnTranslation,
    onRemoveColumn,
    onFontSizeChange,
    onSelectPassage,
    onPrevChapter,
    onNextChapter,
    onToggleBookmark,
  }: Props = $props();

  let isBookModalOpen = $state(false);

  let firstPassage = $derived(passages[0]);
  let currentBook = $derived(firstPassage ? firstPassage.book : 'Génesis');
  let currentChapter = $derived(firstPassage ? firstPassage.chapter : 1);
  let canAddMore = $derived(selectedTranslations.length < 5);
</script>

<div class="reader-view">
  <!-- Elongated Full-Width Search Bar (BibleGateway layout) -->
  <div class="reader-search-bar-row">
    <form class="search-form reader-search-wide" onsubmit={onSearch}>
      <div class="search-input-wrapper">
        <Search size={18} class="search-icon" />
        <input
          type="text"
          aria-label="Buscar pasaje bíblico"
          value={query}
          oninput={(e) => onQueryChange((e.target as HTMLInputElement).value)}
          placeholder="Buscar pasaje (ej. Rut 1:6-8, Juan 3:16, Salmos 23)..."
        />
      </div>
      <button type="submit">Buscar</button>
    </form>
  </div>

  <!-- Reader Card with Centered Side Navigation Buttons & Toolbar -->
  <section class="reader-card relative">
    <!-- Floating Side Navigation Buttons Centered Exactly on the Reading Card -->
    <button
      type="button"
      class="floating-nav-btn floating-prev-btn"
      title="Capítulo anterior ({currentBook} {Math.max(1, currentChapter - 1)})"
      aria-label="Capítulo anterior"
      onclick={onPrevChapter}
    >
      <ChevronLeft size={20} />
    </button>

    <button
      type="button"
      class="floating-nav-btn floating-next-btn"
      title="Siguiente capítulo ({currentBook} {currentChapter + 1})"
      aria-label="Siguiente capítulo"
      onclick={onNextChapter}
    >
      <ChevronRight size={20} />
    </button>

    <!-- Toolbar: Book Selector, Add Parallel, Font Size -->
    <div class="reader-toolbar">
      <div class="toolbar-left-group">
        <button
          type="button"
          class="toolbar-action-btn"
          title="Abrir lista de libros y capítulos de la Biblia"
          onclick={() => (isBookModalOpen = true)}
        >
          <BookOpen size={16} />
          <span>Lista de libros bíblicos</span>
          <ChevronDown size={14} />
        </button>

        <button
          type="button"
          class="toolbar-action-btn add-parallel-btn {canAddMore ? '' : 'is-disabled'}"
          disabled={!canAddMore}
          title={canAddMore ? 'Agregar una nueva versión paralela (máx. 5)' : 'Límite alcanzado (máximo 5 versiones)'}
          onclick={onAddParallelColumn}
        >
          <CopyPlus size={16} />
          <span>Agregar paralelo</span>
          <span class="parallel-count-badge">({selectedTranslations.length}/5)</span>
        </button>
      </div>

      <div class="toolbar-right-group">
        <FontSizeSelector
          currentSize={fontSize}
          onSizeChange={onFontSizeChange}
        />
      </div>
    </div>

    <!-- Parallel Passage Viewer (Dynamic Columns) -->
    <ParallelPassageViewer
      {passages}
      {fontSize}
      {onChangeColumnTranslation}
      {onRemoveColumn}
    />
  </section>

  <!-- Book & Chapter Selector Modal -->
  <BookChapterSelectorModal
    isOpen={isBookModalOpen}
    {currentBook}
    onClose={() => (isBookModalOpen = false)}
    {onSelectPassage}
  />

  <!-- Floating Text Selection & Highlighting Toolbar -->
  <HighlightFloatingToolbar
    activeReference={activeQuery}
    {onToggleBookmark}
  />
</div>
