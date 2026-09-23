<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { ChevronDown, Check } from 'lucide-svelte';

  export interface NeoDropdownOption {
    value: string | number;
    label: string;
  }

  interface Props {
    label: string;
    selectedValue: string | number;
    options: NeoDropdownOption[];
    menuLabel?: string;
    onSelect: (value: string | number) => void;
  }

  let { label, selectedValue, options, menuLabel, onSelect }: Props = $props();

  let isOpen = $state(false);
  let dropdownEl = $state<HTMLDivElement | null>(null);

  let selectedLabel = $derived(
    options.find((o) => o.value === selectedValue)?.label ?? String(selectedValue),
  );

  function handlePick(value: string | number) {
    onSelect(value);
    isOpen = false;
  }

  function handleDocumentClick(event: MouseEvent) {
    if (isOpen && dropdownEl && !dropdownEl.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') isOpen = false;
  }

  onMount(() => {
    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
  });

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    }
  });
</script>

<div class="custom-version-dropdown {isOpen ? 'is-open-active' : ''}" bind:this={dropdownEl}>
  <button
    type="button"
    class="custom-version-trigger {isOpen ? 'is-active' : ''}"
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-label={label}
    data-tooltip={label}
    onclick={() => (isOpen = !isOpen)}
  >
    <span class="version-tag">{label}</span>
    <span class="version-name">{selectedLabel}</span>
    <ChevronDown size={14} class="version-chevron shrink-0 transition-transform {isOpen ? 'rotate-180' : ''}" />
  </button>

  {#if isOpen}
    <div class="custom-version-menu" role="listbox" aria-label={label} tabindex="-1">
      {#if menuLabel}
        <div class="version-menu-header">
          <span>{menuLabel}</span>
          <span class="version-menu-count">({options.length})</span>
        </div>
      {/if}
      <div class="version-options-list">
        {#each options as o (o.value)}
          <button
            type="button"
            role="option"
            aria-selected={o.value === selectedValue}
            class="version-option-btn {o.value === selectedValue ? 'is-selected' : ''}"
            onclick={() => handlePick(o.value)}
          >
            <span class="font-bold text-xs truncate flex-1">{o.label}</span>
            {#if o.value === selectedValue}
              <Check size={15} class="shrink-0 text-[var(--on-accent-active)] ml-2" />
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
