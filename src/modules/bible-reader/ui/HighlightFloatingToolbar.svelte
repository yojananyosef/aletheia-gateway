<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Copy, Bookmark, FileText, Eraser, Check } from 'lucide-svelte';

  export type HighlightColor = 'yellow' | 'coral' | 'blue' | 'green';

  interface Props {
    activeReference: string;
    onToggleBookmark?: () => void;
  }

  let { activeReference = 'Génesis 1:1', onToggleBookmark }: Props = $props();

  let isVisible = $state(false);
  let toolbarX = $state(0);
  let toolbarY = $state(0);
  let selectedText = $state('');
  let copiedToast = $state(false);
  let noteToast = $state(false);

  const colors: { id: HighlightColor; name: string; bg: string }[] = [
    { id: 'yellow', name: 'Amarillo', bg: '#FFD23F' },
    { id: 'coral', name: 'Coral', bg: '#FF6B6B' },
    { id: 'blue', name: 'Azul', bg: '#74B9FF' },
    { id: 'green', name: 'Verde', bg: '#2ECC71' },
  ];

  function handleSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      isVisible = false;
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 2) {
      isVisible = false;
      return;
    }

    selectedText = text;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position toolbar centered above selection
    toolbarX = Math.max(10, rect.left + rect.width / 2);
    toolbarY = Math.max(10, rect.top - 12 + window.scrollY);
    isVisible = true;
  }

  function handleDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.highlight-floating-toolbar') && !window.getSelection()?.toString().trim()) {
      isVisible = false;
    }
  }

  function applyHighlight(color: HighlightColor) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const mark = document.createElement('mark');
    mark.className = `bible-highlight bible-highlight-${color}`;
    
    try {
      range.surroundContents(mark);
    } catch {
      // If selection spans multiple nodes, extract and wrap
      const content = range.extractContents();
      mark.appendChild(content);
      range.insertNode(mark);
    }

    selection.removeAllRanges();
    isVisible = false;
  }

  function removeHighlight() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const anchorNode = selection.anchorNode?.parentElement;
    if (anchorNode && anchorNode.classList.contains('bible-highlight')) {
      const parent = anchorNode.parentNode;
      while (anchorNode.firstChild) {
        parent?.insertBefore(anchorNode.firstChild, anchorNode);
      }
      parent?.removeChild(anchorNode);
    } else {
      document.querySelectorAll('.bible-highlight').forEach((mark) => {
        const text = mark.textContent;
        if (text && selectedText.includes(text)) {
          const parent = mark.parentNode;
          while (mark.firstChild) {
            parent?.insertBefore(mark.firstChild, mark);
          }
          parent?.removeChild(mark);
        }
      });
    }

    selection.removeAllRanges();
    isVisible = false;
  }

  async function handleCopy() {
    if (selectedText) {
      const fullCitation = `"${selectedText}" — ${activeReference}`;
      await navigator.clipboard.writeText(fullCitation);
      copiedToast = true;
      setTimeout(() => {
        copiedToast = false;
        isVisible = false;
      }, 1200);
    }
  }

  function handleAddNote() {
    noteToast = true;
    setTimeout(() => {
      noteToast = false;
      isVisible = false;
    }, 1200);
  }

  onMount(() => {
    document.addEventListener('selectionchange', handleSelection);
    document.addEventListener('mousedown', handleDocumentClick);
  });

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('mousedown', handleDocumentClick);
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
          title="Resaltar con {c.name}"
          aria-label="Resaltar con {c.name}"
          onclick={() => applyHighlight(c.id)}
        ></button>
      {/each}

      <!-- Eraser button -->
      <button
        type="button"
        class="highlight-action-btn eraser-btn"
        title="Quitar resaltado"
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
        title="Copiar texto con cita"
        aria-label="Copiar texto"
        onclick={handleCopy}
      >
        {#if copiedToast}
          <Check size={15} class="text-green-600" />
        {:else}
          <Copy size={15} />
        {/if}
      </button>

      {#if onToggleBookmark}
        <button
          type="button"
          class="highlight-action-btn"
          title="Guardar en biblioteca"
          aria-label="Guardar versículo"
          onclick={onToggleBookmark}
        >
          <Bookmark size={15} />
        </button>
      {/if}

      <button
        type="button"
        class="highlight-action-btn"
        title="Añadir nota personal"
        aria-label="Añadir nota"
        onclick={handleAddNote}
      >
        {#if noteToast}
          <Check size={15} class="text-blue-600" />
        {:else}
          <FileText size={15} />
        {/if}
      </button>
    </div>

    <!-- Toast feedback bubble -->
    {#if copiedToast}
      <div class="toolbar-toast">¡Cita copiada!</div>
    {:else if noteToast}
      <div class="toolbar-toast">¡Nota guardada!</div>
    {/if}
  </div>
{/if}
