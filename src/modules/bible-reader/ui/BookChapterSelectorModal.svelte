<script lang="ts">
  import { X, Search, BookOpen, ChevronRight } from 'lucide-svelte';
  import {
    BIBLE_BOOKS_OT,
    BIBLE_BOOKS_NT,
    ALL_BIBLE_BOOKS,
    findBookInfo,
    type BibleBookInfo,
  } from '../domain/entities/BibleBooks';

  interface Props {
    isOpen: boolean;
    currentBook?: string;
    onClose: () => void;
    onSelectPassage: (ref: string) => void;
  }

  let { isOpen = false, currentBook = 'Génesis', onClose, onSelectPassage }: Props = $props();

  let selectedBook = $state<string>(currentBook || 'Génesis');
  let filterText = $state<string>('');

  // Update selected book when modal opens or currentBook changes
  $effect(() => {
    if (currentBook) {
      selectedBook = currentBook;
    }
  });

  let bookInfo = $derived(findBookInfo(selectedBook) || BIBLE_BOOKS_OT[0]);
  let chaptersList = $derived(
    Array.from({ length: bookInfo.chaptersCount }, (_, i) => i + 1)
  );

  let filteredOT = $derived(
    filterText.trim()
      ? BIBLE_BOOKS_OT.filter((b) =>
          b.name.toLowerCase().includes(filterText.toLowerCase().trim())
        )
      : BIBLE_BOOKS_OT
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
          <BookOpen size={20} class="text-black" />
          <h2 id="book-modal-title" class="font-display font-extrabold text-lg uppercase tracking-tight">
            Lista de Libros Bíblicos
          </h2>
        </div>

        <div class="flex items-center gap-3">
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
            aria-label="Cerrar modal"
            onclick={onClose}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <!-- 3 Columns Content: OT | NT | Chapters -->
      <div class="book-modal-grid">
        <!-- Columna 1: Antiguo Testamento -->
        <div class="book-column">
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
                {#if selectedBook === book.name}
                  <ChevronRight size={15} class="shrink-0 text-black" />
                {/if}
              </button>
            {/each}
          </div>
        </div>

        <!-- Columna 2: Nuevo Testamento -->
        <div class="book-column">
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
                {#if selectedBook === book.name}
                  <ChevronRight size={15} class="shrink-0 text-black" />
                {/if}
              </button>
            {/each}
          </div>
        </div>

        <!-- Columna 3: Capítulos del Libro Seleccionado -->
        <div class="chapters-column">
          <div class="column-title">
            <span class="truncate">{bookInfo.name}</span>
            <span class="count-badge">{bookInfo.chaptersCount} cap.</span>
          </div>

          <div class="chapters-scroll">
            <span class="chapters-hint">Selecciona un capítulo:</span>
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
