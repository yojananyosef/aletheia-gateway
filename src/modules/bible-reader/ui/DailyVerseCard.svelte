<script lang="ts">
  import { untrack } from 'svelte';
  import { Sparkles, ArrowRight, BookOpen, Calendar } from 'lucide-svelte';
  import type { FontSizeOption } from './FontSizeSelector.svelte';
import { AVAILABLE_TRANSLATIONS, type TranslationId } from '../domain/entities/Translation';
import { getTodayVerseReference } from '../domain/entities/DailyVerseCatalog';
import { JsonBibleRepository } from '../infrastructure/JsonBibleRepository';
import { PassageReference } from '../domain/value-objects/PassageReference';

  interface Props {
    fontSize?: FontSizeOption;
    selectedTranslation?: TranslationId;
    onSelectPassage: (ref: string) => void;
  }

  let {
    fontSize = 'medium',
    selectedTranslation = 'RV1909',
    onSelectPassage,
  }: Props = $props();

  const fontSizeClasses: Record<FontSizeOption, string> = {
    'x-small': 'text-size-x-small',
    small: 'text-size-small',
    medium: 'text-size-medium',
    large: 'text-size-large',
    'x-large': 'text-size-x-large',
  };

  const todayMeta = getTodayVerseReference();
  const repo = new JsonBibleRepository();

  let verseText = $state<string>('');
  let verseRef = $state<string>(todayMeta.reference);
  let chapterRef = $state<string>(todayMeta.reference);
  let translationName = $state<string>('');
  let isLoading = $state<boolean>(true);

  function extractNonEmptyText(result: Awaited<ReturnType<JsonBibleRepository['getPassage']>>): string {
    if (!result || !result.sections || result.sections[0]?.verses?.length === 0) return '';
    const nonEmpty = result.sections[0].verses.filter((v) => v.text && v.text.trim().length > 0);
    if (nonEmpty.length === 0) return '';
    return nonEmpty.map((v) => v.text.trim()).join(' ');
  }

  async function loadTodayVerse(targetTranslation: TranslationId) {
    try {
      isLoading = true;
      const refObj = new PassageReference(todayMeta.reference);
      chapterRef = refObj.primarySegment.fullChapterRef;
      verseRef = refObj.fullFormatted;

      // Fallback prioriza mismo idioma (ej. KJV -> ASV/Darby antes que Platense), luego orden preferido del usuario
      const normalizeLang = (lang: string) => (lang === 'enm' ? 'en' : lang);
      const targetLang = normalizeLang(AVAILABLE_TRANSLATIONS[targetTranslation]?.language || 'es');
      const preferredEsOrder: TranslationId[] = ['SpaPlatense', 'VBL', 'BES', 'ONBV', 'RV1909', 'PDDPT', 'BLL', 'BLM', 'SpaRVG'];
      const preferredEnOrder: TranslationId[] = ['KJV', 'ASV', 'Darby', 'Rotherham', 'Noyes', 'Tyndale', 'Wycliffe'];

      const fallbackOrder: TranslationId[] = [targetTranslation];

      // 1) mismo idioma primero
      const sameLangIds = (Object.keys(AVAILABLE_TRANSLATIONS) as TranslationId[]).filter(
        (id) => id !== targetTranslation && normalizeLang(AVAILABLE_TRANSLATIONS[id].language) === targetLang
      );
      if (targetLang === 'es') {
        for (const pid of preferredEsOrder) if (sameLangIds.includes(pid) && !fallbackOrder.includes(pid)) fallbackOrder.push(pid);
        for (const id of sameLangIds) if (!fallbackOrder.includes(id)) fallbackOrder.push(id);
      } else if (targetLang === 'en') {
        for (const pid of preferredEnOrder) if (sameLangIds.includes(pid) && !fallbackOrder.includes(pid)) fallbackOrder.push(pid);
        for (const id of sameLangIds) if (!fallbackOrder.includes(id)) fallbackOrder.push(id);
      } else {
        for (const id of sameLangIds) if (!fallbackOrder.includes(id)) fallbackOrder.push(id);
      }

      // 2) luego orden preferido inter-idioma (Platense → VBL → BES/ONBV para es, para en ya está cubierto)
      const crossPreferred: TranslationId[] = targetLang === 'en'
        ? (['SpaPlatense', 'VBL', 'BES', 'ONBV'] as TranslationId[])
        : (['SpaPlatense', 'VBL', 'BES', 'ONBV', 'KJV', 'ASV'] as TranslationId[]);
      for (const pid of crossPreferred) if (!fallbackOrder.includes(pid)) fallbackOrder.push(pid);

      // 3) resto dinámico
      for (const id of Object.keys(AVAILABLE_TRANSLATIONS) as TranslationId[]) {
        if (!fallbackOrder.includes(id)) fallbackOrder.push(id);
      }

      let foundText = '';
      let foundTranslation: TranslationId | null = null;
      let foundResult: Awaited<ReturnType<JsonBibleRepository['getPassage']>> = null;

      for (const tid of fallbackOrder) {
        const result = await repo.getPassage(todayMeta.reference, tid);
        const text = extractNonEmptyText(result);
        if (text) {
          foundText = text;
          foundTranslation = tid;
          foundResult = result;
          break;
        }
      }

      // Si aún vacío por discrepancia de versificación (ej. RV1909 2Co 13:14 vacío pero 13:13 es el mismo texto),
      // intentar con el versículo anterior en la traducción preferida
      if (!foundText && refObj.primarySegment.startVerse && refObj.primarySegment.startVerse > 1) {
        const prevVerse = refObj.primarySegment.startVerse - 1;
        const prevRef = `${refObj.primarySegment.book} ${refObj.primarySegment.chapter}:${prevVerse}`;
        for (const tid of fallbackOrder.slice(0, 3)) {
          const result = await repo.getPassage(prevRef, tid);
          const text = extractNonEmptyText(result);
          if (text) {
            foundText = text;
            // mantener verseRef original para no confundir cita, pero usar texto del previo como fallback histórico
            foundTranslation = tid;
            foundResult = result;
            break;
          }
        }
      }

      if (foundText && foundResult) {
        verseText = foundText;
        translationName = `${foundResult.translationName} (${foundResult.shortName || foundResult.translationId})`;
        // Si el texto vino de otra traducción distinta a la solicitada, lo indicamos igual (mejor mostrar algo que vacío)
        if (foundTranslation !== targetTranslation) {
          console.warn(`[DailyVerse] ${todayMeta.reference} vacío en ${targetTranslation}, fallback a ${foundTranslation}`);
        }
      } else {
        verseText = 'Texto no disponible para esta referencia.';
        translationName = '';
      }
    } catch (err) {
      console.error('Error loading daily verse:', err);
    } finally {
      isLoading = false;
    }
  }

  $effect(() => {
    const currentTranslation = selectedTranslation;
    untrack(() => {
      loadTodayVerse(currentTranslation);
    });
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
        data-tooltip="Leer el capítulo completo en el lector bíblico ({chapterRef})"
        onclick={() => onSelectPassage(chapterRef)}
      >
        <BookOpen size={16} />
        <span>Leer el capítulo completo</span>
        <ArrowRight size={15} />
      </button>
    </div>
  </article>
</section>
