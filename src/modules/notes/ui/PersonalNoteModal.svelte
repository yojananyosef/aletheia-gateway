<script lang="ts">
  import { onMount } from 'svelte';
  import { X, FileText, Trash2, Check, Sparkles } from 'lucide-svelte';
  import type { PersonalNote } from '../domain/Note';
  import { LocalStorageNoteRepository } from '../infrastructure/LocalStorageNoteRepository';

  interface Props {
    isOpen: boolean;
    reference: string;
    book: string;
    chapter: number;
    verseNumber?: number;
    translationId?: string;
    selectedText?: string;
    existingNoteId?: string;
    existingContent?: string;
    onClose: () => void;
    onSaved?: (note: PersonalNote) => void;
    onDeleted?: (id: string) => void;
  }

  let {
    isOpen = false,
    reference = 'Génesis 1:1',
    book = 'Génesis',
    chapter = 1,
    verseNumber,
    translationId,
    selectedText = '',
    existingNoteId,
    existingContent = '',
    onClose,
    onSaved,
    onDeleted,
  }: Props = $props();

  const noteRepo = new LocalStorageNoteRepository();

  let noteContent = $state('');
  let textareaEl = $state<HTMLTextAreaElement | null>(null);
  let isSaving = $state(false);
  let saveSuccess = $state(false);

  $effect(() => {
    if (isOpen) {
      noteContent = existingContent || '';
      saveSuccess = false;
      setTimeout(() => {
        textareaEl?.focus();
      }, 60);
    }
  });

  async function handleSave() {
    const trimmed = noteContent.trim();
    if (!trimmed) return;

    try {
      isSaving = true;
      const saved = await noteRepo.save({
        id: existingNoteId,
        reference,
        book,
        chapter,
        verseNumber,
        translationId,
        selectedText: selectedText || undefined,
        content: trimmed,
      });

      saveSuccess = true;
      onSaved?.(saved);
      setTimeout(() => {
        isSaving = false;
        onClose();
      }, 500);
    } catch (err) {
      console.error('Error saving personal note:', err);
      isSaving = false;
    }
  }

  async function handleDelete() {
    if (!existingNoteId) return;
    try {
      await noteRepo.remove(existingNoteId);
      onDeleted?.(existingNoteId);
      onClose();
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      handleSave();
    }
  }
</script>

{#if isOpen}
  <div
    class="book-modal-backdrop"
    role="presentation"
    onclick={onClose}
    onkeydown={handleKeyDown}
  >
    <div
      class="personal-note-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-modal-title"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div class="personal-note-header">
        <div class="flex items-center gap-2">
          <FileText size={20} class="text-[#1a1a18]" />
          <h2 id="note-modal-title" class="font-display font-extrabold text-base uppercase tracking-tight">
            Nota Personal: <span class="text-[var(--accent-desire)]">{reference}</span>
          </h2>
        </div>

        <button
          type="button"
          class="modal-close-btn"
          data-tooltip="Cerrar (Esc)"
          aria-label="Cerrar modal"
          onclick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      <!-- Body -->
      <div class="personal-note-body">
        {#if selectedText}
          <div class="note-quote-box">
            <span class="note-quote-label">Texto seleccionado:</span>
            <blockquote class="note-quote-text">“{selectedText}”</blockquote>
          </div>
        {/if}

        <div class="note-input-container">
          <label for="personal-note-textarea" class="note-field-label">
            Tus apuntes y reflexiones:
          </label>
          <textarea
            id="personal-note-textarea"
            bind:this={textareaEl}
            bind:value={noteContent}
            placeholder="Escribe aquí tus notas personales, ideas de estudio, reflexiones devocionales o conexiones de este pasaje..."
            rows="6"
            class="personal-note-textarea"
          ></textarea>
        </div>

        <div class="note-footer-hint">
          <span>Tip: Presiona <kbd class="note-kbd">Ctrl + Enter</kbd> para guardar rápidamente.</span>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="personal-note-footer">
        {#if existingNoteId}
          <button
            type="button"
            class="note-btn-danger"
            data-tooltip="Eliminar esta nota"
            onclick={handleDelete}
          >
            <Trash2 size={16} />
            <span>Eliminar nota</span>
          </button>
        {/if}

        <div class="ml-auto flex items-center gap-2">
          <button
            type="button"
            class="note-btn-secondary"
            onclick={onClose}
          >
            Cancelar
          </button>

          <button
            type="button"
            class="note-btn-primary {saveSuccess ? 'is-success' : ''}"
            disabled={!noteContent.trim() || isSaving}
            onclick={handleSave}
          >
            {#if saveSuccess}
              <Check size={16} />
              <span>¡Guardado!</span>
            {:else}
              <Sparkles size={16} />
              <span>Guardar nota</span>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .personal-note-dialog {
    width: min(100%, 580px);
    border: var(--border-main);
    border-radius: var(--radius-strict);
    background-color: var(--bg-surface);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: popIn 0.12s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .personal-note-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    border-bottom: var(--border-main);
    background-color: var(--accent-attention);
  }

  .personal-note-body {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    background-color: var(--bg-canvas);
  }

  .note-quote-box {
    background-color: var(--bg-surface);
    border: 2px solid var(--border-color);
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .note-quote-label {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 0.05em;
  }

  .note-quote-text {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 0.9375rem;
    font-style: italic;
    color: var(--text-main);
    line-height: 1.45;
  }

  .note-input-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .note-field-label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--text-main);
  }

  .personal-note-textarea {
    width: 100%;
    border: var(--border-main);
    border-radius: var(--radius-strict);
    padding: 12px 14px;
    font-family: var(--font-body);
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--text-main);
    background-color: var(--bg-surface);
    box-shadow: var(--shadow-sm);
    resize: vertical;
    outline: none;
    transition: box-shadow 0.08s ease, transform 0.08s ease;
  }

  .personal-note-textarea:focus {
    box-shadow: var(--shadow-md);
    outline: 2px solid var(--border-color);
  }

  .note-footer-hint {
    font-family: var(--font-mono);
    font-size: 0.71875rem;
    color: var(--text-muted);
  }

  .note-kbd {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-color);
    padding: 1px 5px;
    font-weight: 700;
  }

  .personal-note-footer {
    display: flex;
    align-items: center;
    padding: 12px 18px;
    border-top: var(--border-main);
    background-color: var(--bg-surface);
  }

  .note-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 6px 18px;
    border: 2px solid var(--border-color);
    background-color: var(--accent-attention);
    color: var(--text-main);
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 800;
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
    transition: all 0.08s ease;
  }

  .note-btn-primary:hover:not(:disabled) {
    background-color: var(--accent-interest);
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--border-color);
  }

  .note-btn-primary:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 #000;
  }

  .note-btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .note-btn-primary.is-success {
    background-color: var(--accent-success);
  }

  .note-btn-secondary {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    padding: 6px 14px;
    border: 2px solid transparent;
    background-color: transparent;
    color: var(--text-main);
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
  }

  .note-btn-secondary:hover {
    border-color: var(--border-color);
    background-color: var(--bg-canvas);
  }

  .note-btn-danger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 6px 12px;
    border: 2px solid var(--accent-error);
    background-color: transparent;
    color: var(--accent-error);
    font-family: var(--font-body);
    font-size: 0.8125rem;
    font-weight: 800;
    box-shadow: 2px 2px 0 var(--accent-error);
    cursor: pointer;
    transition: all 0.08s ease;
  }

  .note-btn-danger:hover {
    background-color: var(--accent-error);
    color: #fff;
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--border-color);
  }
</style>
