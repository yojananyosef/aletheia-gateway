<script lang="ts">
  import { onMount } from 'svelte';
  import AppShell from '../../../shared/ui/AppShell.svelte';
  import HomeHero from './HomeHero.svelte';
  import FeatureCards from './FeatureCards.svelte';
  import ReaderView from './ReaderView.svelte';

  import type { TranslationId } from '../domain/entities/Translation';
  import type { PassageVersionResult } from '../domain/entities/Chapter';
  import { PassageReference } from '../domain/value-objects/PassageReference';
  import { MockBibleRepository } from '../infrastructure/MockBibleRepository';
  import { CompareTranslationsUseCase } from '../application/CompareTranslationsUseCase';
  import { LocalStorageBookmarkRepository } from '../../bookmarks/infrastructure/LocalStorageBookmarkRepository';

  // Dependency Inversion / IoC instances
  const bibleRepository = new MockBibleRepository();
  const bookmarkRepository = new LocalStorageBookmarkRepository();
  const compareTranslationsUseCase = new CompareTranslationsUseCase(bibleRepository);

  // Svelte 5 Runes state
  let view = $state<'home' | 'reader'>('home');
  let query = $state('Génesis 1:1');
  let activeQuery = $state('Génesis 1:1');
  let selectedTranslations = $state<TranslationId[]>(['RVC']);
  let isBookmarked = $state(false);
  let passages = $state<PassageVersionResult[]>([]);

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
    loadPassageData();
  });

  function handleSearch(event: SubmitEvent) {
    event.preventDefault();
    if (query.trim()) {
      activeQuery = query.trim();
      view = 'reader';
    }
  }

  function handleGoToReader(nextQuery = query) {
    query = nextQuery;
    activeQuery = nextQuery;
    view = 'reader';
  }

  function handleNavigate(nextView: 'home' | 'reader') {
    view = nextView;
    if (nextView === 'reader') {
      setTimeout(() => {
        const input = document.querySelector<HTMLInputElement>('.reader-search input');
        input?.focus();
      }, 50);
    }
  }

  function handleToggleTranslation(version: TranslationId) {
    if (selectedTranslations.includes(version)) {
      if (selectedTranslations.length > 1) {
        selectedTranslations = selectedTranslations.filter((item) => item !== version);
      }
    } else {
      if (selectedTranslations.length < 5) {
        selectedTranslations = [...selectedTranslations, version];
      }
    }
  }

  function handlePrevChapter() {
    const parsed = PassageReference.parse(activeQuery);
    const prevChapter = Math.max(1, parsed.chapter - 1);
    const newRef = `${parsed.book} ${prevChapter}:1`;
    handleGoToReader(newRef);
  }

  function handleNextChapter() {
    const parsed = PassageReference.parse(activeQuery);
    const nextChapter = parsed.chapter + 1;
    const newRef = `${parsed.book} ${nextChapter}:1`;
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
        translationId: selectedTranslations[0] || 'RVC',
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
        onQueryChange={(val) => (query = val)}
        onSearch={handleSearch}
        onQuickSelect={handleGoToReader}
      />
      <FeatureCards onSelectPassage={handleGoToReader} />
    </div>
  {:else}
    <ReaderView
      {query}
      {activeQuery}
      {passages}
      {selectedTranslations}
      {isBookmarked}
      onSearch={handleSearch}
      onQueryChange={(val) => (query = val)}
      onToggleTranslation={handleToggleTranslation}
      onPrevChapter={handlePrevChapter}
      onNextChapter={handleNextChapter}
      onToggleBookmark={handleToggleBookmark}
    />
  {/if}
</AppShell>
