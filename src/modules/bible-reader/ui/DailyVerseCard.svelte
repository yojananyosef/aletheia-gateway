<script lang="ts">
  import { Sparkles, ArrowRight, BookOpen } from 'lucide-svelte';
  import type { FontSizeOption } from './FontSizeSelector.svelte';

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

  // Daily Verse dataset
  const dailyVerse = {
    reference: 'Salmos 42:8',
    translationName: 'Reina Valera Contemporánea (RVC)',
    text: 'Pero tú, Señor, durante el día enviarás tu gran misericordia, y por la noche tu cántico estará conmigo, con mi oración a ti, Dios de mi vida.',
    chapterRef: 'Salmos 42:8',
  };
</script>

<section class="daily-verse-section">
  <div class="daily-verse-header">
    <div class="daily-verse-title">
      <Sparkles size={16} class="text-[#1a1a18]" />
      <span>VERSÍCULO DEL DÍA</span>
    </div>
  </div>

  <article class="daily-verse-card {fontSizeClasses[fontSize] || 'text-size-medium'}">
    <div class="daily-verse-meta">
      <span class="daily-verse-ref">{dailyVerse.reference}</span>
      <span class="daily-verse-version">({dailyVerse.translationName})</span>
    </div>

    <blockquote class="daily-verse-quote">
      “{dailyVerse.text}”
    </blockquote>

    <div class="daily-verse-actions">
      <button
        type="button"
        class="daily-verse-action-btn"
        title="Leer el capítulo completo en el lector bíblico"
        onclick={() => onSelectPassage(dailyVerse.chapterRef)}
      >
        <BookOpen size={16} />
        <span>Leer el capítulo completo</span>
        <ArrowRight size={15} />
      </button>
    </div>
  </article>
</section>
