<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Copy, Bookmark, FileText, Eraser, Check } from 'lucide-svelte';
  import type { HighlightColor, BibleHighlight } from '../domain/entities/BibleHighlight';
  import { LocalStorageHighlightRepository } from '../infrastructure/LocalStorageHighlightRepository';
  import { LocalStorageBookmarkRepository } from '../../bookmarks/infrastructure/LocalStorageBookmarkRepository';

  interface Props {
    activeReference: string;
    onHighlightChange?: () => void;
    onBookmarkChange?: () => void;
    onOpenNoteModal?: (context: {
      reference: string;
      book: string;
      chapter: number;
      verseNumber?: number;
      translationId?: string;
      selectedText: string;
    }) => void;
  }

  let {
    activeReference = 'Génesis 1:1',
    onHighlightChange,
    onBookmarkChange,
    onOpenNoteModal,
  }: Props = $props();

  const highlightRepo = new LocalStorageHighlightRepository();
  const bookmarkRepo = new LocalStorageBookmarkRepository();

  let isVisible = $state(false);
  let toolbarX = $state(0);
  let toolbarY = $state(0);
  let selectedText = $state('');
  let selectedBook = $state('Génesis');
  let selectedChapter = $state(1);
  let selectedVerse = $state<number | undefined>(undefined);
  let selectedTranslation = $state<string | undefined>(undefined);
  let activeHighlightId = $state<string | null>(null);

  let copiedToast = $state(false);
  let savedToast = $state(false);

  const colors: { id: HighlightColor; name: string; bg: string }[] = [
    { id: 'yellow', name: 'Amarillo', bg: '#FFD23F' },
    { id: 'coral', name: 'Coral', bg: '#FF6B6B' },
    { id: 'blue', name: 'Azul', bg: '#74B9FF' },
    { id: 'green', name: 'Verde', bg: '#2ECC71' },
  ];

  function extractContextFromNode(node: Node | null) {
    if (!node) return;
    const el = (node instanceof HTMLElement ? node : node.parentElement)?.closest('[data-book]') as HTMLElement | null;
    if (el) {
      selectedBook = el.getAttribute('data-book') || selectedBook;
      selectedChapter = parseInt(el.getAttribute('data-chapter') || '1', 10);
      const v = el.getAttribute('data-verse');
      selectedVerse = v ? parseInt(v, 10) : undefined;
      selectedTranslation = el.getAttribute('data-translation') || undefined;
    }
  }

  function handleSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      if (!activeHighlightId) {
        isVisible = false;
      }
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 2) {
      if (!activeHighlightId) isVisible = false;
      return;
    }

    selectedText = text;
    activeHighlightId = null;
    extractContextFromNode(selection.anchorNode);

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    toolbarX = Math.max(10, Math.min(window.innerWidth - 200, rect.left + rect.width / 2));
    toolbarY = Math.max(10, rect.top - 12 + window.scrollY);
    isVisible = true;
  }

  function handleDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // If user clicks on an existing highlight mark
    const mark = target.closest('mark.bible-highlight') as HTMLElement | null;
    if (mark) {
      const hlId = mark.getAttribute('data-highlight-id');
      const text = mark.textContent || '';
      selectedText = text;
      activeHighlightId = hlId;
      extractContextFromNode(mark);

      const rect = mark.getBoundingClientRect();
      toolbarX = Math.max(10, Math.min(window.innerWidth - 200, rect.left + rect.width / 2));
      toolbarY = Math.max(10, rect.top - 12 + window.scrollY);
      isVisible = true;
      return;
    }

    if (!target.closest('.highlight-floating-toolbar') && !window.getSelection()?.toString().trim()) {
      isVisible = false;
      activeHighlightId = null;
    }
  }

  async function applyHighlight(color: HighlightColor) {
    if (!selectedText) return;

    try {
      const ref = selectedVerse
        ? `${selectedBook} ${selectedChapter}:${selectedVerse}`
        : `${selectedBook} ${selectedChapter}`;

      await highlightRepo.save({
        reference: ref,
        book: selectedBook,
        chapter: selectedChapter,
        verseNumber: selectedVerse || 1,
        translationId: selectedTranslation,
        text: selectedText,
        color,
      });

      onHighlightChange?.();
      window.getSelection()?.removeAllRanges();
      isVisible = false;
      activeHighlightId = null;
    } catch (err) {
      console.error('Error applying highlight:', err);
    }
  }

  async function removeHighlight() {
    try {
      if (activeHighlightId) {
        await highlightRepo.remove(activeHighlightId);
      } else if (selectedText) {
        await highlightRepo.removeByText(selectedText, selectedBook, selectedChapter);
      }

      onHighlightChange?.();
      window.getSelection()?.removeAllRanges();
      isVisible = false;
      activeHighlightId = null;
    } catch (err) {
      console.error('Error removing highlight:', err);
    }
  }

  async function handleCopy() {
    if (selectedText) {
      const ref = selectedVerse
        ? `${selectedBook} ${selectedChapter}:${selectedVerse}`
        : activeReference;
      const fullCitation = `"${selectedText}" — ${ref}`;
      await navigator.clipboard.writeText(fullCitation);
      copiedToast = true;
      setTimeout(() => {
        copiedToast = false;
        isVisible = false;
      }, 1200);
    }
  }

  async function handleSaveBookmark() {
    try {
      const ref = selectedVerse
        ? `${selectedBook} ${selectedChapter}:${selectedVerse}`
        : activeReference;

      await bookmarkRepo.save({
        reference: ref,
        book: selectedBook,
        chapter: selectedChapter,
        translationId: selectedTranslation || 'RV1909',
        previewText: selectedText,
      });

      savedToast = true;
      onBookmarkChange?.();
      setTimeout(() => {
        savedToast = false;
        isVisible = false;
      }, 1200);
    } catch (err) {
      console.error('Error saving bookmark:', err);
    }
  }

  function handleOpenNote() {
    const ref = selectedVerse
      ? `${selectedBook} ${selectedChapter}:${selectedVerse}`
      : activeReference;

    onOpenNoteModal?.({
      reference: ref,
      book: selectedBook,
      chapter: selectedChapter,
      verseNumber: selectedVerse,
      translationId: selectedTranslation,
      selectedText,
    });

    isVisible = false;
  }

  onMount(() => {
    document.addEventListener('selectionchange', handleSelection);
    document.addEventListener('click', handleDocumentClick);
  });

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('click', handleDocumentClick);
    }
  });
</script>

{#if isVisible}
  <div
    class="highlight-floating-toolbar"
    style="left: {toolbarX}px; top: {toolbarY}px;"
    role="toolbar"
    aria-label="Herramientas de resaltado y versículos"
    onmousedown={(e) => e.stopPropagation()}
  >
    <!-- Highlight Color Dots -->
    <div class="highlight-colors-row">
      {#each colors as c}
        <button
          type="button"
          class="highlight-dot-btn"
          style="background-color: {c.bg};"
          data-tooltip="Resaltar con {c.name}"
          aria-label="Resaltar con {c.name}"
          onclick={() => applyHighlight(c.id)}
        ></button>
      {/each}

      <!-- Eraser button -->
      <button
        type="button"
        class="highlight-action-btn eraser-btn"
        data-tooltip="Quitar resaltado"
        aria-label="Quitar resaltado"
        onclick={removeHighlight}
      >
        <Eraser size={15} />
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <!-- Action Buttons: Copy, Bookmark, Note -->
    <div class="highlight-actions-row">
      <button
        type="button"
        class="highlight-action-btn"
        data-tooltip="Copiar texto con cita"
        aria-label="Copiar texto"
        onclick={handleCopy}
      >
        {#if copiedToast}
          <Check size={15} class="text-green-600" />
        {:else}
          <Copy size={15} />
        {/if}
      </button>

      <button
        type="button"
        class="highlight-action-btn"
        data-tooltip="Guardar en biblioteca"
        aria-label="Guardar en biblioteca"
        onclick={handleSaveBookmark}
      >
        {#if savedToast}
          <Check size={15} class="text-green-600" />
        {:else}
          <Bookmark size={15} />
        {/if}
      </button>

      <button
        type="button"
        class="highlight-action-btn"
        data-tooltip="Añadir nota personal"
        aria-label="Añadir nota personal"
        onclick={handleOpenNote}
      >
        <FileText size={15} />
      </button>
    </div>

    <!-- Toast feedback bubble -->
    {#if copiedToast}
      <div class="toolbar-toast">¡Cita copiada!</div>
    {:else if savedToast}
      <div class="toolbar-toast">¡Guardado en biblioteca!</div>
    {/if}
  </div>
{/if}
