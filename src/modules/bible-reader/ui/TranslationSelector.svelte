<script lang="ts">
  import { AlignJustify } from 'lucide-svelte';
  import {
    AVAILABLE_TRANSLATIONS,
    type TranslationId,
  } from '../domain/entities/Translation';

  interface Props {
    selectedTranslations: TranslationId[];
    onToggleTranslation: (id: TranslationId) => void;
  }

  let { selectedTranslations = ['RVC'], onToggleTranslation }: Props = $props();

  const allTranslations = Object.keys(AVAILABLE_TRANSLATIONS) as TranslationId[];
</script>

<div class="reader-toolbar">
  <div>
    <span class="toolbar-label">VERSIONES DISPONIBLES</span>
    <div class="translation-pills">
      {#each allTranslations as tid}
        <button
          type="button"
          class="pill {selectedTranslations.includes(tid) ? 'selected' : ''}"
          onclick={() => onToggleTranslation(tid)}
        >
          {tid}
        </button>
      {/each}
    </div>
    <small class="version-hint">Agrega hasta 5 versiones en paralelo para comparar</small>
  </div>

  <button type="button" class="compare-button">
    <AlignJustify size={16} />
    Comparar ({selectedTranslations.length})
  </button>
</div>
