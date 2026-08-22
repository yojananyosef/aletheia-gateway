<script lang="ts">
  import { onMount } from 'svelte';
  import AppShell from '../../../shared/ui/AppShell.svelte';
  import HomeHero from './HomeHero.svelte';
  import DailyVerseCard from './DailyVerseCard.svelte';
  import ReaderView from './ReaderView.svelte';
  import BookChapterSelectorModal from './BookChapterSelectorModal.svelte';

  import {
    AVAILABLE_TRANSLATIONS,
    type TranslationId,
  } from '../domain/entities/Translation';
  import type { PassageVersionResult } from '../domain/entities/Chapter';
  import { PassageReference } from '../domain/value-objects/PassageReference';
  import { JsonBibleRepository } from '../infrastructure/JsonBibleRepository';
  import { CompareTranslationsUseCase } from '../application/CompareTranslationsUseCase';
  import { LocalStorageBookmarkRepository } from '../../bookmarks/infrastructure/LocalStorageBookmarkRepository';
  import type { FontSizeOption } from './FontSizeSelector.svelte';

  // Dependency Inversion / IoC instances
  const bibleRepository = new JsonBibleRepository();
  const bookmarkRepository = new LocalStorageBookmarkRepository();
  const compareTranslationsUseCase = new CompareTranslationsUseCase(bibleRepository);

  // Svelte 5 Runes state
  let view = $state<'home' | 'reader'>('home');
  let query = $state('');
  let activeQuery = $state('Génesis 1:1');
  let selectedTranslations = $state<TranslationId[]>(['RV1909']);
  let isBookmarked = $state(false);
  let passages = $state<PassageVersionResult[]>([]);
  let fontSize = $state<FontSizeOption>('medium');
  let isBookModalOpen = $state(false);

  // Load comparison data whenever activeQuery or selectedTranslations change
  async function loadPassageData() {
    try {
      const results = await compareTranslationsUseCase.execute({
        reference: activeQuery,
        translations: selectedTranslations,
      });
      passages = results;
      isBookmarked = await bookmarkRepository.isBookmarked(activeQuery);
    } catch (err) {
      console.error('Error loading passage data:', err);
    }
  }

  // Effect to reload when query or versions change
  $effect(() => {
    const currentQuery = activeQuery;
    const currentVersions = [...selectedTranslations];
    if (currentQuery && currentVersions.length > 0) {
      loadPassageData();
    }
  });

  onMount(() => {
    try {
      const savedFontSize = localStorage.getItem('alethia_font_size') as FontSizeOption;
      if (savedFontSize) {
        fontSize = savedFontSize;
      }
    } catch {
      // Ignore localStorage restrictions
    }
    loadPassageData();
  });

  function handleFontSizeChange(newSize: FontSizeOption) {
    fontSize = newSize;
    try {
      localStorage.setItem('alethia_font_size', newSize);
    } catch {
      // Ignore
    }
  }

  function handleSearch(event: SubmitEvent) {
    event.preventDefault();
    const targetQuery = query.trim() || activeQuery || 'Génesis 1:1';
    activeQuery = targetQuery;
    query = targetQuery;
    view = 'reader';
  }

  function handleGoToReader(nextQuery = 'Génesis 1:1') {
    query = nextQuery;
    activeQuery = nextQuery;
    view = 'reader';
    isBookModalOpen = false;
  }

  function handleNavigate(nextView: 'home' | 'reader') {
    view = nextView;
    if (nextView === 'reader') {
      if (!query) query = activeQuery;
      setTimeout(() => {
        const input = document.querySelector<HTMLInputElement>('.reader-search input, .reader-search-wide input');
        input?.focus();
      }, 50);
    }
  }

  // Add next available translation to parallel columns (up to 5)
  function handleAddParallelColumn() {
    if (selectedTranslations.length >= 5) return;
    const allKeys = Object.keys(AVAILABLE_TRANSLATIONS) as TranslationId[];
    const unused = allKeys.find((id) => !selectedTranslations.includes(id));
    const nextToAdd = unused || 'BES';
    selectedTranslations = [...selectedTranslations, nextToAdd];
  }

  // Change translation of a specific parallel column
  function handleChangeColumnTranslation(index: number, newTranslationId: TranslationId) {
    const nextList = [...selectedTranslations];
    nextList[index] = newTranslationId;
    selectedTranslations = nextList;
  }

  // Remove a specific parallel column
  function handleRemoveColumn(index: number) {
    if (selectedTranslations.length <= 1) return;
    selectedTranslations = selectedTranslations.filter((_, i) => i !== index);
  }

  function handlePrevChapter() {
    const parsed = PassageReference.parse(activeQuery);
    const prevChapter = Math.max(1, parsed.chapter - 1);
    const newRef = `${parsed.book} ${prevChapter}`;
    handleGoToReader(newRef);
  }

  function handleNextChapter() {
    const parsed = PassageReference.parse(activeQuery);
    const nextChapter = parsed.chapter + 1;
    const newRef = `${parsed.book} ${nextChapter}`;
    handleGoToReader(newRef);
  }

  async function handleToggleBookmark() {
    if (isBookmarked) {
      await bookmarkRepository.remove(activeQuery);
      isBookmarked = false;
    } else {
      const first = passages[0];
      await bookmarkRepository.save({
        reference: activeQuery,
        book: first?.book || 'Génesis',
        chapter: first?.chapter || 1,
        translationId: selectedTranslations[0] || 'RV1909',
        previewText: first?.verses[0]?.text || '',
      });
      isBookmarked = true;
    }
  }
</script>

<AppShell activeView={view} onNavigate={handleNavigate}>
  {#if view === 'home'}
    <div class="home-view">
      <HomeHero
        {query}
        {fontSize}
        onQueryChange={(val) => (query = val)}
        onSearch={handleSearch}
        onOpenBookModal={() => (isBookModalOpen = true)}
        onFontSizeChange={handleFontSizeChange}
      />

      <DailyVerseCard {fontSize} onSelectPassage={handleGoToReader} />

      <!-- Book & Chapter Selector Modal accessible from Home -->
      <BookChapterSelectorModal
        isOpen={isBookModalOpen}
        currentBook="Génesis"
        onClose={() => (isBookModalOpen = false)}
        onSelectPassage={handleGoToReader}
      />
    </div>
  {:else}
    <ReaderView
      {query}
      {activeQuery}
      {passages}
      {selectedTranslations}
      {isBookmarked}
      {fontSize}
      onSearch={handleSearch}
      onQueryChange={(val) => (query = val)}
      onAddParallelColumn={handleAddParallelColumn}
      onChangeColumnTranslation={handleChangeColumnTranslation}
      onRemoveColumn={handleRemoveColumn}
      onFontSizeChange={handleFontSizeChange}
      onSelectPassage={handleGoToReader}
      onPrevChapter={handlePrevChapter}
      onNextChapter={handleNextChapter}
      onToggleBookmark={handleToggleBookmark}
    />
  {/if}
</AppShell>
