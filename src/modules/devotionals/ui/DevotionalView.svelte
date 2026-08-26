<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon,
    BookOpen,
    Copy,
    Check,
    Heart,
    Sparkles,
  } from 'lucide-svelte';
  import type { DailyDevotional, DevotionalReading } from '../domain/Devotional';
  import { JsonDevotionalRepository } from '../infrastructure/JsonDevotionalRepository';

  interface Props {
    onSelectPassage: (ref: string) => void;
  }

  let { onSelectPassage }: Props = $props();

  const repo = new JsonDevotionalRepository();

  let currentDate = $state(new Date());
  let devotional = $state<DailyDevotional | null>(null);
  let activePeriod = $state<'morning' | 'evening'>('morning');
  let isLoading = $state(true);
  let hasCopied = $state(false);

  function getDateKey(date: Date): string {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${mm}.${dd}`;
  }

  async function loadDevotionalForDate(date: Date) {
    isLoading = true;
    try {
      const key = getDateKey(date);
      const data = await repo.getByDate(key);
      devotional = data;
    } catch (err) {
      console.error('Error loading devotional:', err);
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    // Pick morning or evening automatically based on current hour
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 5) {
      activePeriod = 'evening';
    } else {
      activePeriod = 'morning';
    }
    loadDevotionalForDate(currentDate);
  });

  function handlePrevDay() {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    currentDate = prev;
    loadDevotionalForDate(prev);
  }

  function handleNextDay() {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    currentDate = next;
    loadDevotionalForDate(next);
  }

  function handleGoToToday() {
    const today = new Date();
    currentDate = today;
    loadDevotionalForDate(today);
  }

  let activeReading = $derived.by<DevotionalReading | null>(() => {
    if (!devotional) return null;
    return activePeriod === 'morning' ? devotional.morning || null : devotional.evening || null;
  });

  function handleReadInBible() {
    const reading = activeReading;
    if (reading && reading.scriptureReference) {
      onSelectPassage(reading.scriptureReference);
    }
  }

  async function handleCopy() {
    const reading = activeReading;
    if (!reading) return;

    const textToCopy = `${reading.title}\n${devotional?.displayDate || ''}\n\n«${reading.verseQuote}» (${reading.scriptureReference})\n\n${reading.content}\n\n— C.H. Spurgeon (AlethiaGateway)`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      hasCopied = true;
      setTimeout(() => {
        hasCopied = false;
      }, 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }
</script>

<div class="devotional-view-container">
  <!-- Top Navigation Card -->
  <div class="devotional-header-card neo-card">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <!-- Title and Subtitle -->
      <div class="flex items-center gap-3">
        <div class="dev-icon-badge">
          <Heart size={24} class="text-[var(--accent-desire)] fill-[var(--accent-desire)]" />
        </div>
        <div>
          <h1 class="dev-main-title">Devocional Diario</h1>
          <p class="dev-author-badge">C.H. Spurgeon • Lecturas Matutinas y Vespertinas</p>
        </div>
      </div>

      <!-- Date Stepper Controls -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="neo-btn-nav"
          onclick={handlePrevDay}
          data-tooltip="Día anterior"
        >
          <ChevronLeft size={18} />
          <span class="hidden sm:inline">Anterior</span>
        </button>

        <button
          type="button"
          class="neo-date-display"
          onclick={handleGoToToday}
          data-tooltip="Volver a la fecha de hoy"
        >
          <Calendar size={16} />
          <span>{devotional?.displayDate || 'Hoy'}</span>
        </button>

        <button
          type="button"
          class="neo-btn-nav"
          onclick={handleNextDay}
          data-tooltip="Día siguiente"
        >
          <span class="hidden sm:inline">Siguiente</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>

    <!-- Period Tabs (Morning / Evening) -->
    <div class="dev-period-tabs mt-4 pt-4 border-t-2 border-[var(--border-color)]">
      <button
        type="button"
        class="dev-tab-btn {activePeriod === 'morning' ? 'is-active' : ''}"
        onclick={() => (activePeriod = 'morning')}
      >
        <Sun size={18} />
        <span>Lectura Matutina (Mañana)</span>
      </button>
      <button
        type="button"
        class="dev-tab-btn {activePeriod === 'evening' ? 'is-active' : ''}"
        onclick={() => (activePeriod = 'evening')}
      >
        <Moon size={18} />
        <span>Lectura Vespertina (Noche)</span>
      </button>
    </div>
  </div>

  <!-- Main Devotional Content Card -->
  {#if isLoading}
    <div class="dev-loading-card neo-card">
      <div class="animate-pulse flex flex-col gap-4">
        <div class="h-6 bg-black/10 w-1/3"></div>
        <div class="h-16 bg-black/10 w-full"></div>
        <div class="h-4 bg-black/10 w-full"></div>
        <div class="h-4 bg-black/10 w-5/6"></div>
      </div>
    </div>
  {:else if !activeReading}
    <div class="dev-empty-card neo-card">
      <p class="font-bold">No hay lectura devocional registrada para este período.</p>
    </div>
  {:else}
    <article class="dev-article-card neo-card">
      <!-- Scripture Quote Highlight Box -->
      {#if activeReading.verseQuote}
        <div class="dev-quote-box">
          <div class="flex items-start gap-3">
            <Sparkles size={20} class="text-[var(--accent-attention)] shrink-0 mt-0.5" />
            <div class="flex-1">
              <blockquote class="dev-quote-text">
                "{activeReading.verseQuote}"
              </blockquote>
              {#if activeReading.scriptureReference}
                <div class="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-black/15">
                  <span class="dev-ref-badge">
                    {activeReading.scriptureReference}
                  </span>
                  <button
                    type="button"
                    class="dev-read-bible-btn"
                    onclick={handleReadInBible}
                    data-tooltip="Abrir este pasaje en el Lector Bíblico"
                  >
                    <BookOpen size={15} />
                    <span>Leer en la Biblia</span>
                  </button>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- Devotional Body Text -->
      <div class="dev-body-content">
        {#each activeReading.content.split('\n\n') as paragraph}
          {#if paragraph.trim()}
            <p class="dev-paragraph">{paragraph.trim()}</p>
          {/if}
        {/each}
      </div>

      <!-- Action Footer -->
      <div class="dev-article-footer">
        <button
          type="button"
          class="neo-action-btn"
          onclick={handleCopy}
          data-tooltip="Copiar devocional completo"
        >
          {#if hasCopied}
            <Check size={16} class="text-[var(--accent-success)]" />
            <span>¡Copiado!</span>
          {:else}
            <Copy size={16} />
            <span>Copiar devocional</span>
          {/if}
        </button>

        {#if activeReading.scriptureReference}
          <button
            type="button"
            class="neo-action-btn primary"
            onclick={handleReadInBible}
          >
            <BookOpen size={16} />
            <span>Estudiar {activeReading.scriptureReference}</span>
          </button>
        {/if}
      </div>
    </article>
  {/if}
</div>

<style>
  .devotional-view-container {
    max-width: 920px;
    margin: 0 auto;
    padding: 20px 16px 60px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .devotional-header-card {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 18px 20px 20px;
  }

  .dev-article-card,
  .dev-loading-card,
  .dev-empty-card {
    padding: 20px 22px 24px;
  }

  .dev-article-card {
    overflow: visible;
  }

  .dev-icon-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background-color: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    flex-shrink: 0;
  }

  .dev-main-title {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1.1;
    color: var(--text-main);
  }

  .dev-author-badge {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .dev-period-tabs {
    display: flex;
    gap: 10px;
  }

  .dev-tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    font-family: var(--font-display);
    font-size: 0.875rem;
    font-weight: 700;
    background-color: var(--bg-canvas);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .dev-tab-btn:hover {
    background-color: var(--accent-interest);
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--border-color);
  }

  .dev-tab-btn.is-active {
    background-color: var(--accent-attention);
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0 var(--border-color);
  }

  .dev-quote-box {
    background-color: var(--bg-canvas);
    border: 2px solid var(--border-color);
    padding: 18px 20px;
    margin-bottom: 24px;
    box-shadow: 4px 4px 0 var(--border-color);
  }

  .dev-quote-text {
    font-family: var(--font-serif);
    font-size: 1.1875rem;
    font-style: italic;
    font-weight: 600;
    line-height: 1.5;
    color: var(--text-main);
  }

  .dev-ref-badge {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 800;
    background-color: var(--accent-interest);
    border: 1.5px solid var(--border-color);
    padding: 3px 10px;
    box-shadow: 1.5px 1.5px 0 var(--border-color);
  }

  .dev-read-bible-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-display);
    font-size: 0.8125rem;
    font-weight: 800;
    background-color: var(--bg-surface);
    border: 1.5px solid var(--border-color);
    padding: 4px 10px;
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .dev-read-bible-btn:hover {
    background-color: var(--accent-attention);
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--border-color);
  }

  .dev-body-content {
    font-family: var(--font-body);
    font-size: 1.0625rem;
    line-height: 1.75;
    color: var(--text-main);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .dev-paragraph {
    margin: 0;
  }

  .dev-article-footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 32px;
    padding-top: 18px;
    border-top: 2px solid var(--border-color);
  }

  .neo-btn-nav {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-family: var(--font-display);
    font-size: 0.8125rem;
    font-weight: 700;
    background-color: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
  }

  .neo-btn-nav:hover {
    background-color: var(--accent-interest);
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--border-color);
  }

  .neo-date-display {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 800;
    background-color: var(--accent-attention);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
  }

  .neo-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    font-family: var(--font-display);
    font-size: 0.875rem;
    font-weight: 800;
    background-color: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 3px 3px 0 var(--border-color);
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .neo-action-btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 var(--border-color);
  }

  .neo-action-btn.primary {
    background-color: var(--accent-attention);
  }
</style>
