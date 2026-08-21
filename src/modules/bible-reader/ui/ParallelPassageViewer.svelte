<script lang="ts">
  import { Headphones, Highlighter } from 'lucide-svelte';
  import type { PassageVersionResult } from '../domain/entities/Chapter';

  interface Props {
    passages: PassageVersionResult[];
  }

  let { passages = [] }: Props = $props();
</script>

<div
  class="passage-list horizontal"
  style="--version-count: {passages.length || 1};"
>
  {#each passages as passage, index}
    <article class="translation-block">
      <div class="translation-label">
        <span>{passage.translationId}</span>
        <span>{passage.translationName}</span>
      </div>

      {#each passage.verses as verse}
        <p class="passage-text">
          <sup>{verse.number}</sup> {verse.text}
        </p>
      {/each}

      {#if index === 0}
        <div class="passage-actions">
          <button type="button">
            <Headphones size={15} /> Escuchar
          </button>
          <button type="button">
            <Highlighter size={15} /> Resaltar
          </button>
        </div>
      {/if}
    </article>
  {/each}
</div>
