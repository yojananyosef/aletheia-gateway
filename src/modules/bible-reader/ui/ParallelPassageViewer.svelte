<script lang="ts">
  import { X, ChevronDown } from 'lucide-svelte';
  import type { PassageVersionResult } from '../domain/entities/Chapter';
  import {
    AVAILABLE_TRANSLATIONS,
    type TranslationId,
  } from '../domain/entities/Translation';
  import type { FontSizeOption } from './FontSizeSelector.svelte';

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

  const allTranslations = Object.values(AVAILABLE_TRANSLATIONS);

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
      <!-- Column Header with Reference, Version Selector & Close X -->
      <div class="column-top-header">
        <div class="column-title-group">
          <span class="column-ref-label">{passage.reference}</span>

          <!-- Interactive Version Selector Dropdown for this column -->
          <div class="version-select-wrapper">
            <select
              aria-label="Seleccionar versión para esta columna"
              value={passage.translationId}
              onchange={(e) =>
                onChangeColumnTranslation(
                  index,
                  (e.target as HTMLSelectElement).value as TranslationId
                )}
            >
              {#each allTranslations as t}
                <option value={t.id}>{t.shortName} - {t.name}</option>
              {/each}
            </select>
            <ChevronDown size={14} class="select-chevron" />
          </div>
        </div>

        <!-- Close Column Button (X) when more than 1 column is open -->
        {#if passages.length > 1}
          <button
            type="button"
            class="column-close-btn"
            title="Cerrar esta columna paralela"
            aria-label="Cerrar columna {passage.translationId}"
            onclick={() => onRemoveColumn(index)}
          >
            <X size={16} />
          </button>
        {/if}
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
