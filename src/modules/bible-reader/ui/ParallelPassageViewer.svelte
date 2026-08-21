<script lang="ts">
  import { Headphones, Highlighter } from 'lucide-svelte';
  import type { PassageVersionResult } from '../domain/entities/Chapter';

  interface Props {
    passages: PassageVersionResult[];
  }

  let { passages = [] }: Props = $props();
</script>

<div
  class="passage-list-parallel"
  style="--version-count: {passages.length || 1};"
>
  {#each passages as passage, index}
    <article class="translation-block">
      <div class="translation-header">
        <span class="version-tag">{passage.translationId}</span>
        <span class="version-full-name truncate">{passage.translationName}</span>
      </div>

      <div class="verses-content">
        {#each passage.verses as verse}
          <p class="passage-text">
            <sup class="verse-num">{verse.number}</sup> {verse.text}
          </p>
        {/each}
      </div>

      <div class="passage-actions">
        <button type="button" title="Escuchar audio de {passage.translationId}">
          <Headphones size={14} /> Escuchar
        </button>
        <button type="button" title="Resaltar versículo">
          <Highlighter size={14} /> Resaltar
        </button>
      </div>
    </article>
  {/each}
</div>
