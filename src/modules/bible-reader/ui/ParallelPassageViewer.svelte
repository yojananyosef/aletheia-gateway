<script lang="ts">
  import { X } from 'lucide-svelte';
  import type { PassageVersionResult } from '../domain/entities/Chapter';
  import type { TranslationId } from '../domain/entities/Translation';
  import type { FontSizeOption } from './FontSizeSelector.svelte';
  import ColumnVersionDropdown from './ColumnVersionDropdown.svelte';

  interface Props {
    passages: PassageVersionResult[];
    fontSize?: FontSizeOption;
    onChangeColumnTranslation: (index: number, newTranslationId: TranslationId) => void;
    onRemoveColumn: (index: number) => void;
  }

  let {
    passages = [],
    fontSize = 'medium',
    onChangeColumnTranslation,
    onRemoveColumn,
  }: Props = $props();

  const fontSizeClasses: Record<FontSizeOption, string> = {
    'x-small': 'text-size-x-small',
    small: 'text-size-small',
    medium: 'text-size-medium',
    large: 'text-size-large',
    'x-large': 'text-size-x-large',
  };
</script>

<div
  class="passage-list-parallel {fontSizeClasses[fontSize] || 'text-size-medium'}"
  style="--version-count: {passages.length || 1};"
>
  {#each passages as passage, index}
    <article class="translation-block">
      <!-- Column Header: Passage Reference + Close X on top, Full-Width Version Selector below -->
      <div class="column-top-header">
        <div class="column-title-row">
          <span class="column-ref-label">{passage.reference}</span>

          <!-- Close Column Button (X) perfectly aligned with the reference title -->
          {#if passages.length > 1}
            <button
              type="button"
              class="column-close-btn"
              title="Cerrar esta columna paralela"
              aria-label="Cerrar columna {passage.translationId}"
              onclick={() => onRemoveColumn(index)}
            >
              <X size={14} />
            </button>
          {/if}
        </div>

        <!-- Custom Neobrutalist Version Selector Dropdown (Full Column Width) -->
        <ColumnVersionDropdown
          currentId={passage.translationId}
          onSelect={(newId) => onChangeColumnTranslation(index, newId)}
        />
      </div>

      <!-- Verses Content -->
      <div class="verses-content">
        {#each passage.verses as verse}
          <p class="passage-text">
            <span class="verse-num">{verse.number}</span>
            {verse.text}
          </p>
        {/each}
      </div>
    </article>
  {/each}
</div>
