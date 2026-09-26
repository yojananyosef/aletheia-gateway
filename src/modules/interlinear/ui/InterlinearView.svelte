<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { BookOpen, ChevronLeft, ChevronRight, Info } from 'lucide-svelte';
  import NeoDropdown from '../../../shared/ui/NeoDropdown.svelte';
  import { bionicHtml } from '../../../shared/utils/bionic';
  import type { InterlinearTestament, InterlinearVerse } from '../domain/InterlinearVerse';
  import { strongIdForWord, testamentLabel } from '../domain/InterlinearVerse';
  import { describeWord } from '../domain/Morphology';
  import {
    hasNext,
    hasPrevious,
    interlinearBookOrder,
    stepPosition,
    type InterlinearBookOutline,
  } from '../domain/navigation';
import { JsonInterlinearRepository } from '../infrastructure/JsonInterlinearRepository';
import { LocalStorageInterlinearPositionRepository } from '../infrastructure/LocalStorageInterlinearPositionRepository';
import { JsonBibleRepository } from '../../bible-reader/infrastructure/JsonBibleRepository';
import { getAllBooks } from '../../bible-reader/domain/entities/BibleBooks';
import { AVAILABLE_TRANSLATIONS, type TranslationId } from '../../bible-reader/domain/entities/Translation';

  const positionRepo = new LocalStorageInterlinearPositionRepository();
  // Reabre el interlineal donde quedó, no siempre en Génesis 1:1.
  const savedPosition = positionRepo.get();

interface Props {
  initialBook?: string;
  initialChapter?: number;
  initialVerse?: number;
  referenceTranslation?: TranslationId;
  onOpenStrong: (strongId: string) => void;
  onSelectPassage: (ref: string) => void;
}

let {
  initialBook = savedPosition?.book ?? 'Génesis',
  initialChapter = savedPosition?.chapter ?? 1,
  initialVerse = savedPosition?.verse ?? 1,
  referenceTranslation = 'RV1909',
  onOpenStrong,
  onSelectPassage,
}: Props = $props();

  const interlinearRepo = new JsonInterlinearRepository();
  const bibleRepo = new JsonBibleRepository();
  const books = getAllBooks();
  const bookOrder = interlinearBookOrder();

  let bookName = $state(initialBook);
  let chapter = $state(initialChapter);
  let verse = $state(initialVerse);
  let isLoading = $state(true);
  let loadError = $state(false);
  let testament = $state<InterlinearTestament>('hebrew');
  let chapterVerses = $state<InterlinearVerse[]>([]);
  let chapterNumbers = $state<number[]>([]);
  let verseNumbers = $state<number[]>([]);
  let referenceText = $state('');
  let touchedParsing = $state<number | null>(null);
  let touchedRoot = $state<number | null>(null);
  let outline = $state<InterlinearBookOutline | null>(null);
  let canGoPrevious = $state(true);
  let canGoNext = $state(true);
  let requestId = 0;

  let currentVerse = $derived(chapterVerses.find((v) => v.verse === verse) || null);
  let isHebrew = $derived(testament === 'hebrew');
  let referenceShortName = $derived(
    AVAILABLE_TRANSLATIONS[referenceTranslation]?.shortName ?? referenceTranslation
  );

  function resolveOutline(name: string): Promise<InterlinearBookOutline | null> {
    return interlinearRepo.getBookOutline(name);
  }

  async function refreshNavEdges() {
    if (!outline) return;
    const current = { book: bookName, chapter, verse };
    const [prev, next] = await Promise.all([
      hasPrevious(current, verseNumbers, outline, resolveOutline, bookOrder),
      hasNext(current, verseNumbers, outline, resolveOutline, bookOrder),
    ]);
    canGoPrevious = prev;
    canGoNext = next;
  }

  async function loadReferenceVerse(): Promise<string> {
    try {
      const passage = await bibleRepo.getPassage(`${bookName} ${chapter}`, referenceTranslation);
      const found = passage?.verses?.find(
        (item) =>
          item.number === verse ||
          (item.endNumber && verse >= item.number && verse <= item.endNumber)
      );
      return found?.text || '';
    } catch {
      return '';
    }
  }

  async function loadChapter() {
    const id = ++requestId;
    isLoading = true;
    loadError = false;
    touchedParsing = null;
    try {
      const [interlinear, bookOutline] = await Promise.all([
        interlinearRepo.getChapter(bookName, chapter),
        interlinearRepo.getBookOutline(bookName),
      ]);
      if (id !== requestId) return;
      outline = bookOutline;
      if (!interlinear || interlinear.verses.length === 0) {
        loadError = true;
        chapterVerses = [];
        chapterNumbers = [];
        verseNumbers = [];
        referenceText = '';
        canGoPrevious = false;
        canGoNext = false;
        return;
      }
      testament = interlinear.testament;
      chapterVerses = interlinear.verses;
      chapterNumbers = interlinear.chapterNumbers;
      verseNumbers = interlinear.versesOfChapter(chapter);
      if (!verseNumbers.includes(verse)) verse = verseNumbers[0] ?? 1;
      referenceText = await loadReferenceVerse();
      if (id !== requestId) return;
      await refreshNavEdges();
      if (id !== requestId) return;
    } catch {
      if (id !== requestId) return;
      loadError = true;
      chapterVerses = [];
      referenceText = '';
    } finally {
      if (id === requestId) isLoading = false;
    }
  }

  /** Fija/desfija un dato de la palabra en pantallas táctiles (sin hover). */
  function togglePin(current: number | null, kind: 'root' | 'parsing', idx: number) {
    const next = current === idx ? null : idx;
    if (kind === 'root') {
      touchedRoot = next;
      touchedParsing = null;
    } else {
      touchedParsing = next;
      touchedRoot = null;
    }
  }

  function selectBook(name: string) {
    bookName = name;
    chapter = 1;
    verse = 1;
  }

  /**
   * Avanza o retrocede un versículo; al terminar el capítulo salta al siguiente
   * y, si el libro se acaba, continúa en el libro vecino. En el primer o último
   * versículo de la Biblia el botón queda deshabilitado y no hace nada.
   */
  async function stepVerse(delta: -1 | 1) {
    if (!outline || isLoading) return;
    if (delta === 1 && !canGoNext) return;
    if (delta === -1 && !canGoPrevious) return;
    const target = await stepPosition(
      { book: bookName, chapter, verse },
      delta,
      verseNumbers,
      outline,
      resolveOutline,
      bookOrder,
    );
    if (!target) {
      if (delta === 1) canGoNext = false;
      else canGoPrevious = false;
      return;
    }
    const staysInChapter = target.book === bookName && target.chapter === chapter;
    if (target.book !== bookName) bookName = target.book;
    chapter = target.chapter;
    verse = target.verse;
    if (staysInChapter) {
      // Mismo capítulo: sólo cambia el versículo, no hace falta recargar.
      touchedParsing = null;
      referenceText = await loadReferenceVerse();
      await refreshNavEdges();
    }
  }

  $effect(() => {
    const b = bookName;
    const c = chapter;
    if (b && c) {
      untrack(() => {
        loadChapter();
      });
    }
  });

  $effect(() => {
    // Al cambiar el versículo desde el desplegable (sin recargar el capítulo)
    // hay que recalcular si hay verso/capítulo/libro siguiente.
    const v = verse;
    const o = outline;
    if (v && o && verseNumbers.length > 0) {
      untrack(() => {
        refreshNavEdges();
      });
    }
  });

  $effect(() => {
    // Recarga el texto de referencia al cambiar de versículo o de traducción principal
    const v = verse;
    const t = referenceTranslation;
    if (v && t && chapterVerses.length > 0) {
      untrack(() => {
        loadReferenceVerse().then((text) => {
          referenceText = text;
        });
      });
    }
  });

  $effect(() => {
    // Persiste el pasaje para la próxima visita.
    const b = bookName;
    const c = chapter;
    const v = verse;
    if (b && c && v && !isLoading) {
      untrack(() => positionRepo.save({ book: b, chapter: c, verse: v }));
    }
  });

  onMount(() => {
    loadChapter();
  });
</script>

<div class="interlinear-view">
  <div class="interlinear-header">
    <div class="interlinear-titles">
      <h2>Interlineal {testamentLabel(testament)}</h2>
      <span>{bookName} {chapter}:{verse}</span>
    </div>
    <div class="interlinear-selectors">
      <NeoDropdown
        label="Libro"
        selectedValue={bookName}
        options={books.map((b) => ({ value: b.name, label: b.name }))}
        menuLabel="Libros de la Biblia"
        onSelect={(v) => selectBook(String(v))}
      />
      <NeoDropdown
        label="Cap."
        selectedValue={chapter}
        options={chapterNumbers.map((c) => ({ value: c, label: String(c) }))}
        menuLabel="Capítulos"
        onSelect={(v) => {
          chapter = Number(v);
          verse = 1;
        }}
      />
      <NeoDropdown
        label="Vers."
        selectedValue={verse}
        options={verseNumbers.map((v) => ({ value: v, label: String(v) }))}
        menuLabel="Versículos"
        onSelect={(v) => (verse = Number(v))}
      />
    </div>
  </div>

  <div class="interlinear-pager">
    <button
      type="button"
      class="interlinear-nav-btn"
      disabled={!canGoPrevious}
      onclick={() => stepVerse(-1)}
      data-tooltip={canGoPrevious ? 'Versículo o capítulo anterior' : 'Primer versículo de la Biblia'}
    >
      <ChevronLeft size={15} />
      <span>Anterior</span>
    </button>
    <button
      type="button"
      class="interlinear-nav-btn"
      onclick={() => onSelectPassage(`${bookName} ${chapter}:${verse}`)}
      data-tooltip="Abrir este versículo en el lector"
    >
      <BookOpen size={14} />
      <span>Leer en la Biblia</span>
    </button>
    <button
      type="button"
      class="interlinear-nav-btn"
      disabled={!canGoNext}
      onclick={() => stepVerse(1)}
      data-tooltip={canGoNext ? 'Siguiente versículo, capítulo o libro' : 'Último versículo de la Biblia'}
    >
      <span>Siguiente</span>
      <ChevronRight size={15} />
    </button>
  </div>

  {#if isLoading}
    <div class="interlinear-state">
      <span class="interlinear-loading-mark">…</span>
      <p>Cargando {isHebrew ? 'hebreo' : 'griego'}…</p>
    </div>
  {:else if loadError || !currentVerse}
    <div class="interlinear-state">
      <Info size={32} />
      <p>Sin datos interlineales para {bookName} {chapter}:{verse}.</p>
      <span>Prueba con otra referencia.</span>
    </div>
  {:else}
    <div class="interlinear-words" dir={isHebrew ? 'rtl' : 'ltr'}>
      {#each currentVerse.words as word, idx (idx)}
        {@const strongId = strongIdForWord(word, testament)}
        {@const codeDesc = describeWord(word, testament)}
        <div class="interlinear-word">
          {#if strongId}
            <button
              type="button"
              class="interlinear-strong"
              onclick={() => onOpenStrong(strongId!)}
              data-tooltip="Diccionario"
              aria-label="Abrir {strongId} en el diccionario Strong"
            >
              {word.strong}
            </button>
          {:else}
            <!-- Partículas (9xxx) y afijos: se muestra su número como en la
                 referencia, pero no hay entrada en el diccionario. -->
            <span class="interlinear-strong is-particle" data-tooltip="Partícula gramatical">
              {word.strong}
            </span>
          {/if}
          <button
            type="button"
            class="interlinear-original"
            dir={isHebrew ? 'rtl' : 'ltr'}
            lang={isHebrew ? 'he' : 'el'}
            onclick={() => togglePin(touchedRoot, 'root', idx)}
            aria-label="{word.text}: {word.lemma ? 'raíz ' + word.lemma + ', ' : ''}{word.parsing}{word.parsingCode ? ` (${word.parsingCode})` : ''}"
          >
            {word.text}
          </button>
          {#if word.lemma}
            <span class="interlinear-root {touchedRoot === idx ? 'is-pinned' : ''}" aria-hidden="true">
              {word.lemma}
            </span>
          {/if}
          <span class="interlinear-gloss" dir="ltr">{@html bionicHtml(word.spanish ?? '')}</span>
          {#if word.parsingCode || word.parsing}
            <button
              type="button"
              class="interlinear-lemma"
              onclick={() => togglePin(touchedParsing, 'parsing', idx)}
              aria-label="Análisis de {word.text}: {codeDesc || word.parsing}"
            >
              {word.parsingCode || word.parsing}
            </button>
          {/if}
          {#if word.parsing || codeDesc}
            <span class="interlinear-parsing {touchedParsing === idx ? 'is-pinned' : ''}">
              {codeDesc || word.parsing}
            </span>
          {/if}
        </div>
      {/each}
    </div>

    {#if referenceText}
      <div class="interlinear-reference">
        <span class="interlinear-reference-label">{referenceShortName} · {bookName} {chapter}:{verse}</span>
        <p>{referenceText}</p>
      </div>
    {/if}

    <p class="interlinear-hint">
      Pasa el cursor por la palabra para ver su raíz · por el código para el análisis · toca el número Strong
      para abrir el diccionario
    </p>
  {/if}
</div>

<style>
  .interlinear-view {
    width: 100%;
    min-width: 0;
  }

  .interlinear-header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .interlinear-titles h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.375rem;
    font-weight: 900;
  }

  .interlinear-titles span {
    color: var(--text-main);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 800;
  }

  .interlinear-selectors {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .interlinear-pager {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 14px;
  }

  .interlinear-nav-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 11px;
    color: var(--text-main);
    background: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 800;
  }

  .interlinear-nav-btn:hover:not(:disabled) {
    background: var(--accent-active);
    color: var(--on-accent-active);
  }

  .interlinear-nav-btn:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: var(--shadow-active);
  }

  .interlinear-nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
  }

  .interlinear-words {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 14px 28px;
    padding: 26px 20px;
    background: var(--bg-surface);
    border: 3px solid var(--border-color);
    box-shadow: 5px 5px 0 var(--border-color);
  }

  .interlinear-word {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 70px;
    padding-top: 18px;
  }

  .interlinear-strong {
    position: absolute;
    top: 0;
    padding: 0 4px;
    color: var(--accent-interest-ink);
    background: none;
    border: 0;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 700;
  }

  .interlinear-strong:hover {
    color: var(--on-accent-attention);
    background: var(--accent-attention);
    outline: 1.5px solid var(--border-color);
  }

  .interlinear-original {
    padding: 2px 6px;
    color: var(--text-main);
    background: none;
    border: 0;
    cursor: pointer;
    font-family: 'Noto Sans Hebrew', 'Segoe UI', Georgia, serif;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.35;
  }

  .interlinear-original:hover {
    background: var(--accent-attention);
    color: var(--on-accent-attention);
    outline: 2px solid var(--border-color);
  }

  .interlinear-gloss {
    max-width: 140px;
    font-size: 0.8125rem;
    font-weight: 700;
    line-height: 1.3;
    text-align: center;
    opacity: 0.75;
  }

  /* La línea de código es un botón (para el táctil y el foco de teclado), pero
     se ve igual que el texto de antes: mismo cursor, sin interrogación. */
  .interlinear-lemma {
    max-width: 140px;
    padding: 0;
    color: var(--text-muted);
    background: none;
    border: 0;
    cursor: inherit;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1.3;
    text-align: center;
  }

  /* Raíz (lema) de la palabra: sale al pasar por la palabra, igual que en la
     referencia; el análisis sale al pasar por la línea de lema/código. */
  .interlinear-root {
    position: absolute;
    bottom: calc(100% - 6px);
    z-index: 5;
    padding: 3px 8px;
    color: var(--bg-surface);
    background: var(--text-main);
    border: 1.5px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    font-family: 'Noto Sans Hebrew', 'Segoe UI', Georgia, serif;
    font-size: 0.9375rem;
    font-weight: 700;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transform: translateY(4px);
    transition: opacity 0.15s ease, transform 0.15s ease;
  }

  .interlinear-original:hover + .interlinear-root,
  .interlinear-root.is-pinned {
    opacity: 1;
    transform: translateY(0);
  }

  /* Partículas: no hay entrada en el diccionario, así que el número se apaga
     todavía más (y sin cambio de cursor). */
  .interlinear-strong.is-particle {
    color: var(--text-muted);
    font-weight: 500;
    cursor: inherit;
  }

  .interlinear-parsing {
    position: absolute;
    bottom: calc(100% - 6px);
    z-index: 5;
    padding: 3px 8px;
    color: var(--bg-surface);
    background: var(--text-main);
    border: 1.5px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    font-family: var(--font-mono);
    font-size: 0.625rem;
    font-weight: 700;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transform: translateY(4px);
    transition: opacity 0.15s ease, transform 0.15s ease;
  }

  .interlinear-lemma:hover ~ .interlinear-parsing,
  .interlinear-lemma:focus-visible ~ .interlinear-parsing,
  .interlinear-parsing.is-pinned {
    opacity: 1;
    transform: translateY(0);
  }

  .interlinear-reference {
    margin-top: 16px;
    padding: 14px 16px;
    background: var(--bg-canvas);
    border: 2px solid var(--border-color);
    box-shadow: 3px 3px 0 var(--border-color);
  }

  .interlinear-reference-label {
    display: block;
    margin-bottom: 6px;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .interlinear-reference p {
    margin: 0;
    font-size: 0.9375rem;
    font-style: italic;
    line-height: 1.6;
  }

  .interlinear-hint {
    margin: 12px 0 0;
    color: var(--text-muted);
    font-size: 0.75rem;
    text-align: center;
  }

  .interlinear-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 220px;
    gap: 8px;
    color: var(--text-muted);
    text-align: center;
  }

  .interlinear-state p {
    margin: 0;
    color: var(--text-main);
    font-size: 0.875rem;
    font-weight: 800;
  }

  .interlinear-state span {
    font-size: 0.75rem;
  }

  .interlinear-loading-mark {
    font-family: var(--font-mono);
    font-size: 2rem;
    font-weight: 900;
  }
</style>
