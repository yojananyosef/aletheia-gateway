<script lang="ts">
  import { onMount } from 'svelte';
  import {
    ArrowRight,
    BarChart3,
    CalendarDays,
    Check,
    ChevronDown,
    Flame,
    Target,
    Trophy,
  } from 'lucide-svelte';
  import { LocalStorageStreakRepository } from '../infrastructure/LocalStorageStreakRepository';
  import type { WeeklyProgress } from '../domain/streak';

  interface Props {
    /** Si se provee, el card muestra el botón interior hacia Mi progreso. */
    onOpenTracker?: () => void;
  }

  let { onOpenTracker }: Props = $props();

  const repo = new LocalStorageStreakRepository();

  let progress = $state<WeeklyProgress>({
    currentStreak: 0,
    daysVisited: [false, false, false, false, false, false, false],
    todayIndex: new Date().getDay(),
    totalDaysThisYear: 0,
    weeksStreak: 0,
    bestStreak: 0,
  });

  let showStats = $state(false);

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
  <div class="streak-top">
    <span class="streak-flame" aria-hidden="true"><Flame size={24} /></span>
    <div class="streak-title">
      <p class="streak-count">
        Racha de {progress.currentStreak} {progress.currentStreak === 1 ? 'día' : 'días'}
      </p>
      <p class="streak-sub">Hábito diario</p>
    </div>
    <button
      type="button"
      class="streak-stats-toggle"
      aria-expanded={showStats}
      aria-label={showStats ? 'Ocultar estadísticas' : 'Ver estadísticas'}
      onclick={() => (showStats = !showStats)}
    >
      <BarChart3 size={14} />
      <span>{showStats ? 'Ocultar estadísticas' : 'Ver estadísticas'}</span>
      <ChevronDown size={14} class="streak-chevron {showStats ? 'is-open' : ''}" />
    </button>
  </div>

  <div class="streak-week" role="img" aria-label="Días visitados esta semana">
    {#each progress.daysVisited as visited, i}
      <span
        class="streak-day {visited ? 'is-visited' : ''} {i === progress.todayIndex ? 'is-today' : ''}"
        title="{DAY_LABELS[i]}{i === progress.todayIndex ? ' (hoy)' : ''}"
      >
        {#if visited && i === progress.todayIndex}
          <Check size={13} aria-hidden="true" />
        {:else}
          {DAY_LABELS[i]}
        {/if}
      </span>
    {/each}
  </div>

  {#if showStats}
    <ul class="streak-stats">
      <li title="Tu mejor racha de días consecutivos">
        <Trophy size={14} aria-hidden="true" />
        <span>Mejor racha: {progress.bestStreak} {progress.bestStreak === 1 ? 'día' : 'días'}</span>
      </li>
      <li title="Semanas consecutivas con al menos un día de lectura">
        <CalendarDays size={14} aria-hidden="true" />
        <span>
          {progress.weeksStreak}
          {progress.weeksStreak === 1 ? 'semana seguida' : 'semanas seguidas'}
        </span>
      </li>
      <li title="Días distintos que abriste la lectura este año">
        <Target size={14} aria-hidden="true" />
        <span>{progress.totalDaysThisYear} de {yearTotal} días en la Biblia este año</span>
      </li>
    </ul>
  {/if}

  {#if onOpenTracker}
    <button type="button" class="streak-cta" onclick={onOpenTracker}>
      <span>Ver mi progreso completo</span>
      <ArrowRight size={16} aria-hidden="true" />
    </button>
  {/if}
</div>

<style>
  .streak-widget {
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .streak-top {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .streak-flame {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    flex: none;
    background: var(--accent-attention);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    color: var(--text-main);
  }
  .streak-title {
    min-width: 0;
    flex: 1;
  }
  .streak-count {
    font-weight: 900;
    font-size: 1.125rem;
    margin: 0;
  }
  .streak-sub {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 2px 0 0;
    font-weight: 700;
  }
  .streak-stats-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 4px 12px;
    border: 2px solid var(--border-color);
    background-color: var(--bg-surface);
    color: var(--text-main);
    font-family: var(--font-body);
    font-size: 0.75rem;
    font-weight: 800;
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
    transition: transform 0.08s ease-in-out, box-shadow 0.08s ease-in-out;
  }
  .streak-stats-toggle:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--border-color);
  }
  .streak-stats-toggle:active {
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 #000;
  }
  .streak-chevron {
    transition: transform 0.12s ease;
  }
  .streak-chevron.is-open {
    transform: rotate(180deg);
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
  .streak-stats {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .streak-stats li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8125rem;
    font-weight: 800;
    color: var(--text-main);
  }
  .streak-stats li svg {
    flex: none;
    color: var(--text-muted);
  }
  .streak-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 40px;
    padding: 6px 18px;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-strict);
    background-color: var(--accent-attention);
    color: var(--text-main);
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 800;
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
    transition: transform 0.08s ease-in-out, box-shadow 0.08s ease-in-out, background 0.08s ease-in-out;
  }
  .streak-cta:hover {
    background-color: var(--accent-interest);
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--border-color);
  }
  .streak-cta:active {
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 #000;
  }
  @media (max-width: 480px) {
    .streak-cta {
      width: 100%;
    }
  }
</style>
