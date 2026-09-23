<script lang="ts">
  import { onMount } from 'svelte';
  import { Flame, Trophy } from 'lucide-svelte';
  import { LocalStorageStreakRepository } from '../infrastructure/LocalStorageStreakRepository';
  import type { WeeklyProgress } from '../domain/streak';

  const repo = new LocalStorageStreakRepository();

  let progress = $state<WeeklyProgress>({
    currentStreak: 0,
    daysVisited: [false, false, false, false, false, false, false],
    todayIndex: new Date().getDay(),
    totalDaysThisYear: 0,
    weeksStreak: 0,
    bestStreak: 0,
  });

  const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  function daysInYear(year: number): number {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
  }

  let yearTotal = $derived(daysInYear(new Date().getFullYear()));

  onMount(() => {
    progress = repo.recordToday();
  });
</script>

<div class="streak-widget neo-card" aria-live="polite">
  <div class="streak-main">
    <span class="streak-flame" aria-hidden="true"><Flame size={26} /></span>
    <div>
      <p class="streak-count">{progress.currentStreak} {progress.currentStreak === 1 ? 'día' : 'días'}</p>
      <p class="streak-sub">de racha de lectura</p>
    </div>
  </div>
  <div class="streak-week" role="img" aria-label="Días visitados esta semana">
    {#each progress.daysVisited as visited, i}
      <span
        class="streak-day {visited ? 'is-visited' : ''} {i === progress.todayIndex ? 'is-today' : ''}"
        title="{DAY_LABELS[i]}{i === progress.todayIndex ? ' (hoy)' : ''}"
      >{DAY_LABELS[i]}</span>
    {/each}
  </div>
  <div class="streak-meta">
    <span class="streak-best" title="Tu mejor racha de días consecutivos">
      <Trophy size={13} /> Récord: {progress.bestStreak} {progress.bestStreak === 1 ? 'día' : 'días'}
    </span>
    <span class="streak-year" title="Días distintos que abriste la lectura este año">
      {progress.totalDaysThisYear} de {yearTotal} días este año
    </span>
  </div>
</div>

<style>
  .streak-widget {
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .streak-main {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .streak-flame {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    background: var(--accent-attention);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    color: var(--text-main);
  }
  .streak-count {
    font-weight: 900;
    font-size: 1.125rem;
    margin: 0;
  }
  .streak-sub {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 0;
    font-weight: 700;
  }
  .streak-week {
    display: flex;
    gap: 6px;
  }
  .streak-day {
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    font-size: 0.6875rem;
    font-weight: 800;
    border: 2px solid var(--border-color);
    background: var(--bg-surface);
    color: var(--text-muted);
  }
  .streak-day.is-visited {
    background: var(--accent-success);
    color: #000;
  }
  .streak-day.is-today {
    outline: 2px dashed var(--border-color);
    outline-offset: 2px;
  }
  .streak-meta {
    display: flex;
    gap: 12px;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
  }
  .streak-best {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
</style>
