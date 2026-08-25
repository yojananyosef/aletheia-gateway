<script lang="ts">
  import { X, Search, BookOpen, ChevronRight } from 'lucide-svelte';
  import {
    BIBLE_BOOKS_NT,
    DEUTEROCANONICAL_BOOK_CODES,
    getBooksOT,
    findBookInfo,
    type BibleBookInfo,
  } from '../domain/entities/BibleBooks';
  import {
    supportsDeuterocanonical,
    type TranslationId,
  } from '../domain/entities/Translation';

  interface Props {
    isOpen: boolean;
    currentBook?: string;
    activeTranslations?: TranslationId[] | TranslationId;
    onClose: () => void;
    onSelectPassage: (ref: string) => void;
  }

  let {
    isOpen = false,
    currentBook = 'Génesis',
    activeTranslations = ['RV1909'],
    onClose,
    onSelectPassage,
  }: Props = $props();

  let includeDeut = $derived(supportsDeuterocanonical(activeTranslations));
  let otBooks = $derived(getBooksOT(includeDeut));

  let selectedBook = $state<string>(currentBook || 'Génesis');
  let filterText = $state<string>('');
  let mobileTab = $state<'ot' | 'nt' | 'chapters'>('ot');

  // Update selected book when modal opens, currentBook changes, or canon changes
  $effect(() => {
    if (currentBook) {
      const isDeut = DEUTEROCANONICAL_BOOK_CODES.includes(findBookInfo(currentBook)?.code || '');
      if (isDeut && !includeDeut) {
        selectedBook = 'Génesis';
      } else {
        selectedBook = currentBook;
      }
    }
  });

  let bookInfo = $derived(findBookInfo(selectedBook) || otBooks[0]);
  let chaptersList = $derived(
    Array.from({ length: bookInfo.chaptersCount }, (_, i) => i + 1)
  );

  let filteredOT = $derived(
    filterText.trim()
      ? otBooks.filter((b) =>
          b.name.toLowerCase().includes(filterText.toLowerCase().trim())
        )
      : otBooks
  );

  let filteredNT = $derived(
    filterText.trim()
      ? BIBLE_BOOKS_NT.filter((b) =>
          b.name.toLowerCase().includes(filterText.toLowerCase().trim())
        )
      : BIBLE_BOOKS_NT
  );

  function handleSelectBook(book: BibleBookInfo) {
    selectedBook = book.name;
    mobileTab = 'chapters';
  }

  function handleSelectChapter(chapterNum: number) {
    onSelectPassage(`${selectedBook} ${chapterNum}`);
    onClose();
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
      class="book-modal-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-modal-title"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Modal Header -->
      <div class="book-modal-header">
        <div class="flex items-center gap-2">
          <BookOpen size={20} class="text-black shrink-0" />
          <h2 id="book-modal-title" class="font-display font-extrabold text-base sm:text-lg uppercase tracking-tight truncate">
            Lista de Libros
          </h2>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <div class="book-search-input">
            <Search size={14} class="text-black shrink-0" />
            <input
              type="text"
              placeholder="Filtrar libro..."
              value={filterText}
              oninput={(e) => (filterText = (e.target as HTMLInputElement).value)}
            />
            {#if filterText}
              <button
                type="button"
                class="clear-filter-btn"
                data-tooltip="Limpiar filtro"
                onclick={() => (filterText = '')}
                aria-label="Limpiar filtro"
              >
                <X size={12} />
              </button>
            {/if}
          </div>

          <button
            type="button"
            class="modal-close-btn"
            data-tooltip="Cerrar modal (Esc)"
            aria-label="Cerrar modal"
            onclick={onClose}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <!-- Mobile/Tablet Segmented Tabs (Visible <= 960px) -->
      <div class="book-modal-mobile-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'ot'}
          class="mobile-tab-btn {mobileTab === 'ot' ? 'is-active' : ''}"
          onclick={() => (mobileTab = 'ot')}
        >
          <span>Antiguo T.</span>
          <span class="mobile-tab-badge">{filteredOT.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'nt'}
          class="mobile-tab-btn {mobileTab === 'nt' ? 'is-active' : ''}"
          onclick={() => (mobileTab = 'nt')}
        >
          <span>Nuevo T.</span>
          <span class="mobile-tab-badge">{filteredNT.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'chapters'}
          class="mobile-tab-btn {mobileTab === 'chapters' ? 'is-active' : ''}"
          onclick={() => (mobileTab = 'chapters')}
        >
          <span class="truncate">Capítulos ({bookInfo.name})</span>
        </button>
      </div>

      <!-- 3 Columns Content: OT | NT | Chapters -->
      <div class="book-modal-grid active-tab-{mobileTab}">
        <!-- Columna 1: Antiguo Testamento -->
        <div class="book-column col-ot">
          <div class="column-title">
            <span>Antiguo Testamento</span>
            <span class="count-badge">{filteredOT.length}</span>
          </div>
          <div class="book-list-scroll">
            {#each filteredOT as book}
              <button
                type="button"
                class="book-item-btn {selectedBook === book.name ? 'is-selected' : ''}"
                onclick={() => handleSelectBook(book)}
              >
                <span>{book.name}</span>
                <ChevronRight size={15} class="shrink-0 text-black opacity-60" />
              </button>
            {/each}
          </div>
        </div>

        <!-- Columna 2: Nuevo Testamento -->
        <div class="book-column col-nt">
          <div class="column-title">
            <span>Nuevo Testamento</span>
            <span class="count-badge">{filteredNT.length}</span>
          </div>
          <div class="book-list-scroll">
            {#each filteredNT as book}
              <button
                type="button"
                class="book-item-btn {selectedBook === book.name ? 'is-selected' : ''}"
                onclick={() => handleSelectBook(book)}
              >
                <span>{book.name}</span>
                <ChevronRight size={15} class="shrink-0 text-black opacity-60" />
              </button>
            {/each}
          </div>
        </div>

        <!-- Columna 3: Capítulos del Libro Seleccionado -->
        <div class="chapters-column col-chapters">
          <div class="column-title">
            <span class="truncate">{bookInfo.name}</span>
            <span class="count-badge">{bookInfo.chaptersCount} cap.</span>
          </div>

          <div class="chapters-scroll">
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="chapters-hint">Selecciona un capítulo:</span>
              <button
                type="button"
                class="mobile-back-to-books-btn"
                onclick={() => (mobileTab = 'ot')}
              >
                ← Cambiar libro
              </button>
            </div>
            <div class="chapters-grid">
              {#each chaptersList as chapterNum}
                <button
                  type="button"
                  class="chapter-grid-btn"
                  onclick={() => handleSelectChapter(chapterNum)}
                >
                  {chapterNum}
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
