<script lang="ts">
  import { Search, ChevronLeft, ChevronRight, Bookmark } from 'lucide-svelte';
  import type { TranslationId } from '../domain/entities/Translation';
  import type { PassageVersionResult } from '../domain/entities/Chapter';
  import TranslationSelector from './TranslationSelector.svelte';
  import ParallelPassageViewer from './ParallelPassageViewer.svelte';

  interface Props {
    query: string;
    activeQuery: string;
    passages: PassageVersionResult[];
    selectedTranslations: TranslationId[];
    isBookmarked: boolean;
    onSearch: (event: SubmitEvent) => void;
    onQueryChange: (val: string) => void;
    onToggleTranslation: (id: TranslationId) => void;
    onPrevChapter: () => void;
    onNextChapter: () => void;
    onToggleBookmark: () => void;
  }

  let {
    query = '',
    activeQuery = 'Génesis 1:1',
    passages = [],
    selectedTranslations = ['RVC'],
    isBookmarked = false,
    onSearch,
    onQueryChange,
    onToggleTranslation,
    onPrevChapter,
    onNextChapter,
    onToggleBookmark,
  }: Props = $props();

  let firstPassage = $derived(passages[0]);
  let currentBook = $derived(firstPassage ? firstPassage.book : 'Génesis');
  let currentChapter = $derived(firstPassage ? firstPassage.chapter : 1);
  let currentTitle = $derived(firstPassage?.title || `${currentBook} ${currentChapter}`);
</script>

<div class="reader-view">
  <section class="reader-top">
    <div class="reader-top-left">
      <div class="eyebrow">LECTURA BÍBLICA</div>
      <h1>{activeQuery}</h1>
      <p class="reader-subtitle">{currentTitle} <span>·</span> {currentBook} {currentChapter}</p>
    </div>

    <div class="reader-top-right">
      <form class="search-form reader-search" onsubmit={onSearch}>
        <Search size={16} class="text-black shrink-0" />
        <input
          aria-label="Buscar otro pasaje"
          value={query}
          oninput={(e) => onQueryChange((e.target as HTMLInputElement).value)}
          placeholder="Buscar pasaje..."
        />
        <button type="submit">Buscar</button>
      </form>
    </div>
  </section>

  <section class="reader-card">
    <TranslationSelector
      {selectedTranslations}
      {onToggleTranslation}
    />

    <ParallelPassageViewer {passages} />

    <div class="reader-footer">
      <button type="button" onclick={onPrevChapter}>
        <ChevronLeft size={16} /> Capítulo anterior
      </button>
      <span class="font-bold">{currentBook} {currentChapter}</span>
      <button type="button" onclick={onNextChapter}>
        Siguiente capítulo <ChevronRight size={16} />
      </button>
    </div>
  </section>

  <aside class="reader-note">
    <div class="flex items-center gap-3">
      <Bookmark size={22} class="shrink-0" />
      <span>
        <strong>Guarda tu lectura.</strong>
        {isBookmarked ? ' Pasaje guardado en tu biblioteca personal.' : ' Inicia sesión o guarda pasajes para crear tu propia biblioteca.'}
      </span>
    </div>
    <button type="button" onclick={onToggleBookmark}>
      {isBookmarked ? 'Guardado ✓' : 'Guardar pasaje'}
    </button>
  </aside>
</div>
