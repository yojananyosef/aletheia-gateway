<script lang="ts">
  import { onMount } from 'svelte';
  import { Sparkles, ArrowRight, BookOpen, Calendar } from 'lucide-svelte';
  import type { FontSizeOption } from './FontSizeSelector.svelte';
  import { getTodayVerseReference } from '../domain/entities/DailyVerseCatalog';
  import { JsonBibleRepository } from '../infrastructure/JsonBibleRepository';
  import { PassageReference } from '../domain/value-objects/PassageReference';

  interface Props {
    fontSize?: FontSizeOption;
    onSelectPassage: (ref: string) => void;
  }

  let { fontSize = 'medium', onSelectPassage }: Props = $props();

  const fontSizeClasses: Record<FontSizeOption, string> = {
    'x-small': 'text-size-x-small',
    small: 'text-size-small',
    medium: 'text-size-medium',
    large: 'text-size-large',
    'x-large': 'text-size-x-large',
  };

  const todayMeta = getTodayVerseReference();
  const repo = new JsonBibleRepository();

  let verseText = $state<string>('De día mandará Jehová su misericordia, y de noche su canción será conmigo...');
  let verseRef = $state<string>(todayMeta.reference);
  let chapterRef = $state<string>(todayMeta.reference);
  let translationName = $state<string>('Reina Valera 1909 (RV1909)');
  let isLoading = $state<boolean>(true);

  async function loadTodayVerse() {
    try {
      isLoading = true;
      const refObj = new PassageReference(todayMeta.reference);
      chapterRef = refObj.primarySegment.fullChapterRef;
      verseRef = refObj.fullFormatted;

      const result = await repo.getPassage(todayMeta.reference, 'RV1909');
      if (result && result.sections && result.sections[0]?.verses?.length > 0) {
        const textParts = result.sections[0].verses.map((v) => v.text).join(' ');
        verseText = textParts;
        translationName = `${result.translationName} (${result.shortName || result.translationId})`;
      }
    } catch (err) {
      console.error('Error loading daily verse:', err);
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadTodayVerse();
  });
</script>

<section class="daily-verse-section">
  <div class="daily-verse-header">
    <div class="daily-verse-title">
      <Sparkles size={16} class="text-[#1a1a18]" />
      <span>VERSÍCULO DEL DÍA</span>
    </div>

    <div class="daily-verse-date-badge">
      <Calendar size={13} />
      <span>{todayMeta.dateFormatted}</span>
    </div>
  </div>

  <article class="daily-verse-card {fontSizeClasses[fontSize] || 'text-size-medium'}">
    <div class="daily-verse-meta">
      <span class="daily-verse-ref">{verseRef}</span>
      <span class="daily-verse-version">({translationName})</span>
    </div>

    <blockquote class="daily-verse-quote">
      {#if isLoading}
        <span class="daily-verse-loading">Cargando versículo del día...</span>
      {:else}
        “{verseText}”
      {/if}
    </blockquote>

    <div class="daily-verse-actions">
      <button
        type="button"
        class="daily-verse-action-btn"
        title="Leer el capítulo completo en el lector bíblico ({chapterRef})"
        onclick={() => onSelectPassage(chapterRef)}
      >
        <BookOpen size={16} />
        <span>Leer el capítulo completo</span>
        <ArrowRight size={15} />
      </button>
    </div>
  </article>
</section>
