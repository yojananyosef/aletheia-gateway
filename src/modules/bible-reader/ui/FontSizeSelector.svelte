<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Type, ChevronDown } from 'lucide-svelte';

  export type FontSizeOption = 'x-small' | 'small' | 'medium' | 'large' | 'x-large';

  interface Props {
    currentSize: FontSizeOption;
    onSizeChange: (size: FontSizeOption) => void;
  }

  let { currentSize = 'medium', onSizeChange }: Props = $props();

  let isOpen = $state(false);
  let containerEl = $state<HTMLDivElement | null>(null);

  const options: { id: FontSizeOption; label: string; sample: string }[] = [
    { id: 'x-large', label: 'X-Grande', sample: '22px' },
    { id: 'large', label: 'Grande', sample: '20px' },
    { id: 'medium', label: 'Medio', sample: '18px (Normal)' },
    { id: 'small', label: 'Pequeño', sample: '16px' },
    { id: 'x-small', label: 'X-Pequeño', sample: '14px' },
  ];

  let currentLabel = $derived(
    options.find((o) => o.id === currentSize)?.label || 'Medio'
  );

  function handleSelect(size: FontSizeOption) {
    onSizeChange(size);
    isOpen = false;
  }

  function handleDocumentClick(event: MouseEvent) {
    if (isOpen && containerEl && !containerEl.contains(event.target as Node)) {
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

<div class="font-size-dropdown-container" bind:this={containerEl}>
  <button
    type="button"
    class="font-size-trigger-btn {isOpen ? 'is-active' : ''}"
    aria-expanded={isOpen}
    aria-haspopup="listbox"
    title="Ajustar tamaño de fuente del lector"
    onclick={() => (isOpen = !isOpen)}
  >
    <Type size={16} />
    <span class="truncate">Tamaño: <strong>{currentLabel}</strong></span>
    <ChevronDown size={14} class="shrink-0 transition-transform {isOpen ? 'rotate-180' : ''}" />
  </button>

  {#if isOpen}
    <div
      class="font-size-menu"
      role="listbox"
      tabindex="-1"
    >
      <div class="menu-label">Tamaño de Fuente</div>
      <div class="font-size-options-list">
        {#each options as opt}
          <button
            type="button"
            role="option"
            aria-selected={currentSize === opt.id}
            class="font-size-option-btn {currentSize === opt.id ? 'is-selected' : ''}"
            onclick={() => handleSelect(opt.id)}
          >
            <span class="font-bold text-xs">{opt.label}</span>
            <span class="sample-tag font-mono text-[11px]">{opt.sample}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
