<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import AppShell from '../../../shared/ui/AppShell.svelte';
  import HomeHero from './HomeHero.svelte';
  import DailyVerseCard from './DailyVerseCard.svelte';
  import ReaderView from './ReaderView.svelte';
  import BookChapterSelectorModal from './BookChapterSelectorModal.svelte';
  import SavedVersesModal from '../../bookmarks/ui/SavedVersesModal.svelte';
  import ConcordanceView from '../../concordance/ui/ConcordanceView.svelte';
  import DevotionalView from '../../devotionals/ui/DevotionalView.svelte';
  import SettingsModal from '../../settings/ui/SettingsModal.svelte';

  import {
    AVAILABLE_TRANSLATIONS,
    type TranslationId,
  } from '../domain/entities/Translation';
  import type { PassageVersionResult } from '../domain/entities/Chapter';
  import { getAllBooks } from '../domain/entities/BibleBooks';
  import { JsonBibleRepository } from '../infrastructure/JsonBibleRepository';
  import { CompareTranslationsUseCase } from '../application/CompareTranslationsUseCase';
  import { LocalStorageBookmarkRepository } from '../../bookmarks/infrastructure/LocalStorageBookmarkRepository';
  import type { FontSizeOption } from './FontSizeSelector.svelte';

  const STORAGE_KEY_PASSAGE = 'alethia_last_passage';
  const STORAGE_KEY_FONT_SIZE = 'alethia_font_size';
  const STORAGE_KEY_TRANSLATIONS = 'alethia_selected_translations';

  // Dependency Inversion / IoC instances
  const bibleRepository = new JsonBibleRepository();
  const bookmarkRepository = new LocalStorageBookmarkRepository();
  const compareTranslationsUseCase = new CompareTranslationsUseCase(bibleRepository);

  // Svelte 5 Runes state
  let view = $state<'home' | 'reader' | 'concordance' | 'devotionals'>('home');
  let homeQuery = $state('');
  let readerQuery = $state('Génesis 1:1');
  let activeQuery = $state('Génesis 1:1');
  let concordanceQuery = $state('');
  let selectedTranslations = $state<TranslationId[]>(['RV1909']);
  let isBookmarked = $state(false);
  let bookmarkCount = $state(0);
  let passages = $state<PassageVersionResult[]>([]);
  let fontSize = $state<FontSizeOption>('medium');
  let isBookModalOpen = $state(false);
  let isSavedVersesModalOpen = $state(false);
  let isSettingsModalOpen = $state(false);

  async function updateBookmarkCount() {
    try {
      const all = await bookmarkRepository.getAll();
      bookmarkCount = all.length;
      isBookmarked = await bookmarkRepository.isBookmarked(activeQuery);
    } catch {
      // Ignore
    }
  }

  // Load comparison data whenever activeQuery or selectedTranslations change
  async function loadPassageData() {
    try {
      const results = await compareTranslationsUseCase.execute({
        reference: activeQuery,
        translations: selectedTranslations,
      });
      passages = results;
      await updateBookmarkCount();
    } catch (err) {
      console.error('Error loading passage data:', err);
    }
  }

  // Effect to reload when query or versions change
  $effect(() => {
    const currentQuery = activeQuery;
    const currentVersions = [...selectedTranslations];
    if (currentQuery && currentVersions.length > 0) {
      untrack(() => {
        loadPassageData();
      });
    }
  });

  onMount(() => {
    try {
      const savedPassage = localStorage.getItem(STORAGE_KEY_PASSAGE);
      if (savedPassage && savedPassage.trim()) {
        activeQuery = savedPassage.trim();
        readerQuery = savedPassage.trim();
      }
      const savedFontSize = localStorage.getItem(STORAGE_KEY_FONT_SIZE) as FontSizeOption;
      if (savedFontSize) {
        fontSize = savedFontSize;
      }
      const savedTranslations = localStorage.getItem(STORAGE_KEY_TRANSLATIONS);
      if (savedTranslations) {
        try {
          const parsed = JSON.parse(savedTranslations);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Migration: deduplicate corrupted state that caused each_key_duplicate
            // (e.g. ["RV1909","RV1909"] persisted before duplicate guard)
            const validIds = new Set(Object.keys(AVAILABLE_TRANSLATIONS) as TranslationId[]);
            const deduped: TranslationId[] = [];
            for (const id of parsed) {
              if (validIds.has(id) && !deduped.includes(id)) deduped.push(id);
            }
            if (deduped.length > 0) {
              if (deduped.length !== parsed.length) {
                selectedTranslations = deduped.slice(0, 5);
                saveTranslations(selectedTranslations);
                console.warn('Deduplicated corrupted selectedTranslations', { before: parsed, after: selectedTranslations });
              } else {
                selectedTranslations = deduped.slice(0, 5);
              }
            }
          }
        } catch {
          // corrupt JSON – keep default
        }
      }
    } catch {
      // Ignore localStorage restrictions
    }
    loadPassageData();
    updateBookmarkCount();
  });

  function saveActivePassage(ref: string) {
    try {
      localStorage.setItem(STORAGE_KEY_PASSAGE, ref);
    } catch {
      // Ignore
    }
  }

  function saveTranslations(list: TranslationId[]) {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSLATIONS, JSON.stringify(list));
    } catch {
      // Ignore
    }
  }

  function handleFontSizeChange(newSize: FontSizeOption) {
    fontSize = newSize;
    try {
      localStorage.setItem(STORAGE_KEY_FONT_SIZE, newSize);
    } catch {
      // Ignore
    }
  }

  function handleHomeSearch(event?: Event) {
    if (event) event.preventDefault();
    const targetQuery = homeQuery.trim() || activeQuery || 'Génesis 1:1';
    activeQuery = targetQuery;
    readerQuery = targetQuery;
    homeQuery = ''; // Keep home search bar clean for subsequent searches
    saveActivePassage(targetQuery);
    view = 'reader';
  }

  function handleReaderSearch(event?: Event) {
    if (event) event.preventDefault();
    const targetQuery = readerQuery.trim() || activeQuery || 'Génesis 1:1';
    activeQuery = targetQuery;
    readerQuery = targetQuery;
    saveActivePassage(targetQuery);
  }

  function handleGoToReader(nextQuery = 'Génesis 1:1') {
    activeQuery = nextQuery;
    readerQuery = nextQuery;
    saveActivePassage(nextQuery);
    view = 'reader';
    isBookModalOpen = false;
    isSavedVersesModalOpen = false;
  }

  function handleNavigate(nextView: 'home' | 'reader' | 'concordance' | 'devotionals') {
    view = nextView;
    if (nextView === 'reader') {
      readerQuery = activeQuery;
      setTimeout(() => {
        const input = document.querySelector<HTMLInputElement>('.reader-search-wide input');
        input?.focus();
      }, 50);
    }
  }

  // Add next available translation to parallel columns (up to 5) – never duplicates
  function handleAddParallelColumn() {
    if (selectedTranslations.length >= 5) return;
    const allKeys = Object.keys(AVAILABLE_TRANSLATIONS) as TranslationId[];
    const unused = allKeys.find((id) => !selectedTranslations.includes(id));
    if (!unused) return; // all translations already visible – avoid duplicating 'BES'
    selectedTranslations = [...selectedTranslations, unused];
    saveTranslations(selectedTranslations);
  }

  // Change translation of a specific parallel column – reject duplicates
  function handleChangeColumnTranslation(index: number, newTranslationId: TranslationId) {
    if (selectedTranslations[index] === newTranslationId) return;
    if (selectedTranslations.includes(newTranslationId)) {
      console.warn(`Translation ${newTranslationId} already visible in another column`);
      return;
    }
    const nextList = [...selectedTranslations];
    nextList[index] = newTranslationId;
    selectedTranslations = nextList;
    saveTranslations(selectedTranslations);
  }

  // Remove a specific parallel column
  function handleRemoveColumn(index: number) {
    if (selectedTranslations.length <= 1) return;
    selectedTranslations = selectedTranslations.filter((_, i) => i !== index);
    saveTranslations(selectedTranslations);
  }

  function handlePrevChapter() {
    const p = passages[0];
    if (!p) return;
    const all = getAllBooks();
    const curIdx = all.findIndex((b) => b.name === p.book || b.code === p.book);
    if (curIdx === -1) return;

    if (p.chapter > 1) {
      handleGoToReader(`${p.book} ${p.chapter - 1}`);
    } else if (curIdx > 0) {
      const prevBook = all[curIdx - 1];
      handleGoToReader(`${prevBook.name} ${prevBook.chaptersCount}`);
    }
  }

  function handleNextChapter() {
    const p = passages[0];
    if (!p) return;
    const all = getAllBooks();
    const curIdx = all.findIndex((b) => b.name === p.book || b.code === p.book);
    if (curIdx === -1) return;

    const curBookInfo = all[curIdx];
    if (p.chapter < curBookInfo.chaptersCount) {
      handleGoToReader(`${p.book} ${p.chapter + 1}`);
    } else if (curIdx < all.length - 1) {
      const nextBook = all[curIdx + 1];
      handleGoToReader(`${nextBook.name} 1`);
    }
  }

  async function handleToggleBookmark() {
    try {
      const nowBookmarked = await bookmarkRepository.toggle(activeQuery, passages[0]?.book || 'Génesis');
      isBookmarked = nowBookmarked;
      await updateBookmarkCount();
    } catch {
      // Ignore
    }
  }
</script>

<AppShell
  activeView={view}
  {bookmarkCount}
  onNavigate={handleNavigate}
  onOpenBookmarks={() => (isSavedVersesModalOpen = true)}
  onOpenSettings={() => (isSettingsModalOpen = true)}
>
  {#if view === 'home'}
    <div class="home-view">
      <HomeHero
        query={homeQuery}
        {fontSize}
        onQueryChange={(val) => (homeQuery = val)}
        onSearch={handleHomeSearch}
        onOpenBookModal={() => (isBookModalOpen = true)}
        onFontSizeChange={handleFontSizeChange}
      />

      <DailyVerseCard
        {fontSize}
        selectedTranslation={selectedTranslations[0] || 'RV1909'}
        onSelectPassage={handleGoToReader}
      />

      <!-- Book & Chapter Selector Modal accessible from Home -->
      <BookChapterSelectorModal
        isOpen={isBookModalOpen}
        currentBook="Génesis"
        activeTranslations={selectedTranslations}
        onClose={() => (isBookModalOpen = false)}
        onSelectPassage={handleGoToReader}
      />
    </div>
  {:else if view === 'concordance'}
    <ConcordanceView
      initialQuery={concordanceQuery}
      initialTranslation={selectedTranslations[0] || 'RV1909'}
      onSelectPassage={handleGoToReader}
    />
  {:else if view === 'devotionals'}
    <DevotionalView
      onSelectPassage={handleGoToReader}
    />
  {:else}
    <ReaderView
      query={readerQuery}
      {activeQuery}
      {passages}
      {selectedTranslations}
      {isBookmarked}
      {fontSize}
      onSearch={handleReaderSearch}
      onQueryChange={(val) => (readerQuery = val)}
      onAddParallelColumn={handleAddParallelColumn}
      onChangeColumnTranslation={handleChangeColumnTranslation}
      onRemoveColumn={handleRemoveColumn}
      onFontSizeChange={handleFontSizeChange}
      onSelectPassage={handleGoToReader}
      onPrevChapter={handlePrevChapter}
      onNextChapter={handleNextChapter}
      onToggleBookmark={handleToggleBookmark}
      onBookmarkChange={updateBookmarkCount}
    />
  {/if}

  <!-- Saved Verses Modal accessible globally -->
  <SavedVersesModal
    isOpen={isSavedVersesModalOpen}
    onClose={() => (isSavedVersesModalOpen = false)}
    onSelectPassage={handleGoToReader}
    onBookmarksChange={updateBookmarkCount}
  />

  <!-- Settings Modal accessible globally -->
  <SettingsModal
    isOpen={isSettingsModalOpen}
    onClose={() => (isSettingsModalOpen = false)}
    onDataRestored={() => {
      updateBookmarkCount();
      loadPassageData();
    }}
  />
</AppShell>
