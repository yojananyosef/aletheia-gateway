<script lang="ts">
  import { BookOpen, RotateCcw, Trophy } from 'lucide-svelte';
  import { getAllBooks, type BibleBookInfo } from '../../bible-reader/domain/entities/BibleBooks';
  import {
    bookProgress,
    completedCount,
    isChapterCompleted,
    totalProgress,
    type ProgressMap,
  } from '../domain/progress';
  import { LocalStorageTrackerRepository } from '../infrastructure/LocalStorageTrackerRepository';
  import { LocalStorageStreakRepository } from '../infrastructure/LocalStorageStreakRepository';

  interface Props {
    onSelectPassage: (ref: string) => void;
  }

  let { onSelectPassage }: Props = $props();

  const trackerRepo = new LocalStorageTrackerRepository();
  const streakRepo = new LocalStorageStreakRepository();

  const books: BibleBookInfo[] = getAllBooks(false);
  const totalChapters = books.reduce((acc, b) => acc + b.chaptersCount, 0);

  let progress = $state<ProgressMap>(trackerRepo.getProgress());
  let testamentFilter = $state<'all' | 'AT' | 'NT'>('all');
  let query = $state('');
  let confirmReset = $state(false);

  let done = $derived(completedCount(progress));
  let total = $derived(totalProgress(progress, books));

  let visibleBooks = $derived(
    books.filter((b) => {
      if (testamentFilter !== 'all' && b.testament !== testamentFilter) return false;
      if (query.trim() && !b.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    }),
  );

  function handleToggle(bookCode: string, chapter: number) {
    progress = trackerRepo.toggleChapter(bookCode, chapter);
    streakRepo.recordToday();
  }

  function firstIncomplete(book: BibleBookInfo): number {
    for (let c = 1; c <= book.chaptersCount; c++) {
      if (!isChapterCompleted(progress, book.code, c)) return c;
    }
    return 1;
  }

  function handleReset() {
    if (!confirmReset) {
      confirmReset = true;
      setTimeout(() => (confirmReset = false), 4000);
      return;
    }
    trackerRepo.resetProgress();
    progress = {};
    confirmReset = false;
  }
</script>

<div class="tracker-view">
  <div class="tracker-header-card neo-card">
    <div class="flex items-center gap-3">
      <div class="tracker-icon-badge"><Trophy size={22} /></div>
      <div>
        <h1 class="tracker-title">Mi progreso de lectura</h1>
        <p class="tracker-sub">{done} de {totalChapters} capítulos ({total}%)</p>
      </div>
    </div>
    <div class="tracker-total-bar" role="progressbar" aria-valuenow={total} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso total de lectura">
      <span class="tracker-total-fill" style="width: {total}%"></span>
    </div>
    <div class="tracker-controls">
      <div class="tracker-tabs" role="group" aria-label="Filtrar por testamento">
        {#each [['all', 'Toda'], ['AT', 'AT'], ['NT', 'NT']] as [val, label]}
          <button
            type="button"
            class="tracker-tab-btn {testamentFilter === val ? 'is-active' : ''}"
            onclick={() => (testamentFilter = val as typeof testamentFilter)}
          >{label}</button>
        {/each}
      </div>
      <input
        type="search"
        class="tracker-search"
        placeholder="Buscar libro…"
        aria-label="Buscar libro"
        value={query}
        oninput={(e) => (query = (e.target as HTMLInputElement).value)}
      />
      <button
        type="button"
        class="tracker-reset-btn {confirmReset ? 'is-confirm' : ''}"
        onclick={handleReset}
        data-tooltip={confirmReset ? 'Pulsa de nuevo para confirmar' : 'Reiniciar todo el progreso'}
      >
        <RotateCcw size={14} />
        <span>{confirmReset ? '¿Confirmar reinicio?' : 'Reiniciar'}</span>
      </button>
    </div>
  </div>

  <div class="tracker-books">
    {#each visibleBooks as book}
      {@const pct = bookProgress(progress, book.code, book.chaptersCount)}
      <details class="tracker-book neo-card">
        <summary class="tracker-book-head">
          <span class="tracker-book-name">{book.name}</span>
          <span class="tracker-book-bar" aria-hidden="true"><span style="width: {pct}%"></span></span>
          <span class="tracker-book-pct">{pct}%</span>
        </summary>
        <div class="tracker-chapters">
          {#each Array.from({ length: book.chaptersCount }, (_, i) => i + 1) as ch}
            <button
              type="button"
              class="tracker-ch {isChapterCompleted(progress, book.code, ch) ? 'is-done' : ''}"
              aria-pressed={isChapterCompleted(progress, book.code, ch)}
              aria-label="{book.name} {ch} ({isChapterCompleted(progress, book.code, ch) ? 'leído' : 'pendiente'})"
              onclick={() => handleToggle(book.code, ch)}
            >{ch}</button>
          {/each}
        </div>
        <button
          type="button"
          class="tracker-read-btn"
          onclick={() => onSelectPassage(`${book.name} ${firstIncomplete(book)}`)}
        >
          <BookOpen size={14} />
          <span>Leer {book.name} {firstIncomplete(book)}</span>
        </button>
      </details>
    {:else}
      <p class="tracker-empty">Sin libros para ese filtro.</p>
    {/each}
  </div>
</div>

<style>
  .tracker-view {
    max-width: 920px;
    margin: 0 auto;
    padding: 20px 16px 60px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .tracker-header-card {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .tracker-icon-badge {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    background: var(--accent-attention);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    color: var(--on-accent-attention);
  }
  .tracker-title {
    font-size: 1.25rem;
    font-weight: 900;
    margin: 0;
  }
  .tracker-sub {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-muted);
    margin: 0;
  }
  .tracker-total-bar {
    height: 18px;
    border: 2px solid var(--border-color);
    background: var(--bg-canvas);
  }
  .tracker-total-fill {
    display: block;
    height: 100%;
    background: var(--accent-success);
  }
  .tracker-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .tracker-tabs {
    display: flex;
    gap: 6px;
  }
  .tracker-tab-btn,
  .tracker-reset-btn {
    border: 2px solid var(--border-color);
    background: var(--bg-surface);
    font-weight: 800;
    font-size: 0.75rem;
    padding: 6px 10px;
    box-shadow: 2px 2px 0 var(--border-color);
  }
  .tracker-tab-btn.is-active {
    background: var(--accent-active);
    color: var(--on-accent-active);
  }
  .tracker-reset-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
  }
  .tracker-reset-btn.is-confirm {
    background: var(--accent-error-solid);
    color: var(--on-accent-error-solid);
  }
  .tracker-search {
    border: 2px solid var(--border-color);
    background: var(--bg-surface);
    padding: 6px 10px;
    font-size: 0.8125rem;
    font-weight: 700;
    min-width: 160px;
  }
  .tracker-book {
    padding: 0;
  }
  .tracker-book-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    cursor: pointer;
    list-style: none;
    font-weight: 800;
  }
  .tracker-book-head::-webkit-details-marker {
    display: none;
  }
  .tracker-book-name {
    min-width: 120px;
  }
  .tracker-book-bar {
    flex: 1;
    height: 12px;
    border: 2px solid var(--border-color);
    background: var(--bg-canvas);
  }
  .tracker-book-bar > span {
    display: block;
    height: 100%;
    background: var(--accent-interest);
  }
  .tracker-book-pct {
    font-size: 0.75rem;
    min-width: 48px;
    text-align: right;
  }
  .tracker-chapters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 0 14px 12px;
  }
  .tracker-ch {
    width: 38px;
    height: 34px;
    border: 2px solid var(--border-color);
    background: var(--bg-surface);
    font-weight: 800;
    font-size: 0.75rem;
  }
  .tracker-ch.is-done {
    background: var(--accent-success);
    color: var(--on-accent-success);
  }
  .tracker-read-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0 14px 14px;
    border: 2px solid var(--border-color);
    background: var(--accent-attention);
    color: var(--on-accent-attention);
    font-weight: 800;
    font-size: 0.8125rem;
    padding: 6px 10px;
    box-shadow: 2px 2px 0 var(--border-color);
  }
  .tracker-empty {
    font-weight: 700;
  }
</style>
