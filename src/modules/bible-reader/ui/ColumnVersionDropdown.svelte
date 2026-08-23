<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { ChevronDown, Check } from 'lucide-svelte';
  import {
    AVAILABLE_TRANSLATIONS,
    type TranslationId,
  } from '../domain/entities/Translation';

  interface Props {
    currentId: TranslationId;
    onSelect: (newId: TranslationId) => void;
  }

  let { currentId, onSelect }: Props = $props();

  let isOpen = $state(false);
  let dropdownEl = $state<HTMLDivElement | null>(null);
  const allTranslations = Object.values(AVAILABLE_TRANSLATIONS);

  let currentTranslation = $derived(
    AVAILABLE_TRANSLATIONS[currentId] || AVAILABLE_TRANSLATIONS.RV1909
  );

  function handlePick(id: TranslationId) {
    onSelect(id);
    isOpen = false;
  }

  function handleDocumentClick(event: MouseEvent) {
    if (isOpen && dropdownEl && !dropdownEl.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  onMount(() => {
    document.addEventListener('mousedown', handleDocumentClick);
  });

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('mousedown', handleDocumentClick);
    }
  });
</script>

<div class="custom-version-dropdown {isOpen ? 'is-open-active' : ''}" bind:this={dropdownEl}>
  <button
    type="button"
    class="custom-version-trigger {isOpen ? 'is-active' : ''}"
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    data-tooltip="Cambiar versión para esta columna ({currentTranslation.name})"
    onclick={() => (isOpen = !isOpen)}
  >
    <span class="version-tag">{currentTranslation.shortName}</span>
    <span class="version-name">{currentTranslation.name}</span>
    <ChevronDown size={14} class="version-chevron shrink-0 transition-transform {isOpen ? 'rotate-180' : ''}" />
  </button>

  {#if isOpen}
    <div
      class="custom-version-menu"
      role="listbox"
      tabindex="-1"
    >
      <div class="version-menu-header">
        <span>Versiones disponibles</span>
        <span class="version-menu-count">({allTranslations.length})</span>
      </div>
      <div class="version-options-list">
        {#each allTranslations as t}
          <button
            type="button"
            role="option"
            aria-selected={t.id === currentId}
            class="version-option-btn {t.id === currentId ? 'is-selected' : ''}"
            onclick={() => handlePick(t.id)}
          >
            <span class="option-tag">{t.shortName}</span>
            <span class="font-bold text-xs truncate flex-1">{t.name}</span>
            {#if t.id === currentId}
              <Check size={15} class="shrink-0 text-black ml-2" />
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
