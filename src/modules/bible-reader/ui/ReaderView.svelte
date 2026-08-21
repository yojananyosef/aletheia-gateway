<script lang="ts">
  import {
    Search,
    ChevronLeft,
    ChevronRight,
    Bookmark,
    BookOpen,
    CopyPlus,
    ChevronDown,
  } from 'lucide-svelte';
  import type { TranslationId } from '../domain/entities/Translation';
  import type { PassageVersionResult } from '../domain/entities/Chapter';
  import ParallelPassageViewer from './ParallelPassageViewer.svelte';
  import BookChapterSelectorModal from './BookChapterSelectorModal.svelte';
  import FontSizeSelector, { type FontSizeOption } from './FontSizeSelector.svelte';

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
    isBookmarked = false,
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
  let currentTitle = $derived(firstPassage?.title || `${currentBook} ${currentChapter}`);
  let canAddMore = $derived(selectedTranslations.length < 5);
</script>

<div class="reader-view relative">
  <!-- Slim Floating Side Navigation Buttons for Desktop -->
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

  <!-- Top Search & Title Header -->
  <section class="reader-top">
    <div class="reader-top-left">
      <div class="eyebrow">LECTURA BÍBLICA</div>
      <h1>{activeQuery}</h1>
      <p class="reader-subtitle">{currentTitle} <span>·</span> {currentBook} {currentChapter}</p>
    </div>

    <div class="reader-top-right">
      <form class="search-form reader-search" onsubmit={onSearch}>
        <div class="search-input-wrapper">
          <Search size={16} class="search-icon" />
          <input
            type="text"
            aria-label="Buscar otro pasaje"
            value={query}
            oninput={(e) => onQueryChange((e.target as HTMLInputElement).value)}
            placeholder="Buscar pasaje (ej. Rut 1:6-8, Juan 3:16)..."
          />
        </div>
        <button type="submit">Buscar</button>
      </form>
    </div>
  </section>

  <!-- Reader Card with Toolbar -->
  <section class="reader-card">
    <div class="reader-toolbar">
      <!-- Left Controls: Book Selector & Add Parallel Button -->
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

      <!-- Right Controls: Chapter Nav (Mobile & Desktop) + Font Size Dropdown -->
      <div class="toolbar-right-group">
        <div class="toolbar-chapter-nav">
          <button
            type="button"
            class="toolbar-nav-arrow-btn"
            title="Capítulo anterior"
            aria-label="Capítulo anterior"
            onclick={onPrevChapter}
          >
            <ChevronLeft size={16} />
          </button>
          <span class="toolbar-chapter-indicator">{currentBook} {currentChapter}</span>
          <button
            type="button"
            class="toolbar-nav-arrow-btn"
            title="Siguiente capítulo"
            aria-label="Siguiente capítulo"
            onclick={onNextChapter}
          >
            <ChevronRight size={16} />
          </button>
        </div>

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

  <!-- Bookmark Callout -->
  <aside class="reader-note">
    <div class="flex items-center gap-3">
      <Bookmark size={22} class="shrink-0" />
      <span>
        <strong>Guarda tu lectura.</strong>
        {isBookmarked ? ' Pasaje guardado en tu biblioteca personal.' : ' Inicia sesión o guarda pasajes para crear tu propia biblioteca.'}
      </span>
    </div>
    <button type="button" onclick={onToggleBookmark}>
      {isBookmarked ? 'Guardado ✓' : 'Guardar pasaje'}
    </button>
  </aside>

  <!-- Book & Chapter Selector Modal -->
  <BookChapterSelectorModal
    isOpen={isBookModalOpen}
    {currentBook}
    onClose={() => (isBookModalOpen = false)}
    {onSelectPassage}
  />
</div>
