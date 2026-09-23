<script lang="ts">
  import { onMount } from 'svelte';
  import {
    ListChecks,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    Library,
    CircleCheck,
    Circle,
  } from 'lucide-svelte';
  import type { EgwChapter, PlanDay, PlanIndexEntry } from '../domain/ReadingPlan';
  import { resolveEgwBookFile } from '../domain/ReadingPlan';
  import {
    completedPlanDays,
    isPlanDayCompleted,
    planProgress,
    type PlanProgressMap,
  } from '../domain/PlanProgress';
  import { LocalStoragePlanProgressRepository } from '../infrastructure/LocalStoragePlanProgressRepository';
  import { JsonPlanRepository } from '../infrastructure/JsonPlanRepository';

  interface Props {
    onSelectPassage: (ref: string) => void;
  }

  let { onSelectPassage }: Props = $props();

  const repo = new JsonPlanRepository();
  const progressRepo = new LocalStoragePlanProgressRepository();

  let index = $state<PlanIndexEntry[]>([]);
  let selectedId = $state<string | null>(null);
  let selectedDay = $state(1);
  let day = $state<PlanDay | null>(null);
  let isLoadingIndex = $state(true);
  let isLoadingDay = $state(false);
  // Días completados por plan ({ [planId]: number[] }), espejo reactivo del repo.
  let doneMap = $state<PlanProgressMap>({});

  // Capítulo EGW expandido (refs { label, chapterId } de annual-thematic).
  let egwOpenKey = $state<string | null>(null);
  let egwChapter = $state<EgwChapter | null>(null);
  let egwLoading = $state(false);
  let egwMissing = $state(false);

  onMount(async () => {
    try {
      doneMap = progressRepo.getProgress();
    } catch {
      doneMap = {};
    }
    try {
      index = await repo.getIndex();
    } finally {
      isLoadingIndex = false;
    }
  });

  function doneCount(entry: PlanIndexEntry): number {
    return completedPlanDays(doneMap, entry.id);
  }

  function donePct(entry: PlanIndexEntry): number {
    return planProgress(doneMap, entry.id, entry.durationDays);
  }

  function toggleDay(planId: string, d: number) {
    try {
      doneMap = progressRepo.toggleDay(planId, d);
    } catch {
      // Sin almacenamiento: no se persiste, pero no se rompe la vista.
    }
  }

  async function openPlan(id: string) {
    selectedId = id;
    selectedDay = 1;
    resetEgw();
    await loadDay(id, 1);
  }

  async function loadDay(id: string, d: number) {
    isLoadingDay = true;
    resetEgw();
    try {
      day = await repo.getDay(id, d);
    } finally {
      isLoadingDay = false;
    }
  }

  function resetEgw() {
    egwOpenKey = null;
    egwChapter = null;
    egwLoading = false;
    egwMissing = false;
  }

  function prevDay() {
    if (!selectedId || selectedDay <= 1) return;
    selectedDay -= 1;
    loadDay(selectedId, selectedDay);
  }

  function nextDay(entry: PlanIndexEntry) {
    if (!selectedId || selectedDay >= entry.durationDays) return;
    selectedDay += 1;
    loadDay(selectedId, selectedDay);
  }

  async function toggleEgw(label: string, chapterId: number | undefined) {
    const key = `${label}#${chapterId ?? ''}`;
    if (egwOpenKey === key) {
      resetEgw();
      return;
    }
    resetEgw();
    if (chapterId === undefined) return;
    const bookFile = resolveEgwBookFile(label);
    if (!bookFile) return;
    egwOpenKey = key;
    egwLoading = true;
    try {
      egwChapter = await repo.getEgwChapter(bookFile, chapterId);
      egwMissing = egwChapter === null;
    } finally {
      egwLoading = false;
    }
  }

  function paragraphs(text: string): string[] {
    return text
      .split('\n\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  let selectedEntry = $derived(index.find((e) => e.id === selectedId) ?? null);
  let dayDone = $derived(
    selectedEntry ? isPlanDayCompleted(doneMap, selectedEntry.id, selectedDay) : false
  );
</script>

<div class="plans-section">
  {#if !selectedId || !selectedEntry}
    {#if isLoadingIndex}
      <p class="plans-loading">Cargando planes de lectura…</p>
    {:else if index.length === 0}
      <p class="plans-loading">No hay planes disponibles sin conexión.</p>
    {:else}
      <div class="plans-grid">
        {#each index as entry}
          {@const done = doneCount(entry)}
          {@const pct = donePct(entry)}
          <button type="button" class="plan-card neo-card" onclick={() => openPlan(entry.id)}>
            <span class="plan-category">{entry.category} • {entry.durationDays} días</span>
            <span class="plan-title">{entry.title}</span>
            <span class="plan-desc">{entry.description}</span>
            <span
              class="plan-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-label={`Progreso de ${entry.title}: ${done} de ${entry.durationDays} días`}
            >
              <span class="plan-progress-track"><span class="plan-progress-fill" style={`width: ${pct}%`}></span></span>
              <span class="plan-progress-label">
                {#if pct >= 100}
                  <CircleCheck size={13} /> Completado
                {:else}
                  {done} de {entry.durationDays} días • {pct}%
                {/if}
              </span>
            </span>
            <span class="plan-open"><ListChecks size={14} /> Abrir plan</span>
          </button>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="plan-detail">
      <button type="button" class="neo-btn-nav" onclick={() => (selectedId = null)}>
        <ChevronLeft size={16} /> Todos los planes
      </button>
      <h2 class="plan-detail-title">{selectedEntry.title}</h2>
      <p class="plan-desc">
        Día {selectedDay} de {selectedEntry.durationDays} •
        {doneCount(selectedEntry)} completados ({donePct(selectedEntry)}%)
      </p>

      <div class="plan-day-nav">
        <button type="button" class="neo-btn-nav" disabled={selectedDay <= 1} onclick={prevDay}>
          <ChevronLeft size={16} /> Anterior
        </button>
        <button
          type="button"
          class="neo-btn-nav"
          disabled={selectedDay >= selectedEntry.durationDays}
          onclick={() => nextDay(selectedEntry!)}
        >
          Siguiente <ChevronRight size={16} />
        </button>
        <button
          type="button"
          class="plan-day-toggle {dayDone ? 'is-done' : ''}"
          aria-pressed={dayDone}
          data-tooltip={dayDone ? 'Marcar este día como pendiente' : 'Marcar este día como completado'}
          aria-label={dayDone ? 'Marcar día como pendiente' : 'Marcar día como completado'}
          onclick={() => toggleDay(selectedEntry!.id, selectedDay)}
        >
          {#if dayDone}
            <CircleCheck size={16} /> <span>Día completado</span>
          {:else}
            <Circle size={16} /> <span>Marcar día como completado</span>
          {/if}
        </button>
      </div>

      {#if isLoadingDay}
        <p class="plans-loading">Cargando día {selectedDay}…</p>
      {:else if !day || (!day.title && day.bible.length === 0 && day.egw.length === 0)}
        <p class="plans-loading">Este día aún no tiene contenido.</p>
      {:else}
        {#if day.title}
          <h3 class="plan-day-title">{day.title}</h3>
        {/if}
        {#if day.description}
          <p class="plan-desc">{day.description}</p>
        {/if}
        {#if day.bible.length > 0}
          <h4 class="plan-sub">Lectura bíblica</h4>
          <div class="plan-refs">
            {#each day.bible as ref}
              <button type="button" class="plan-ref-btn" onclick={() => onSelectPassage(ref.label)}>
                <BookOpen size={14} /> {ref.label}
              </button>
            {/each}
          </div>
        {/if}
        {#if day.egw.length > 0}
          <h4 class="plan-sub">Lectura complementaria</h4>
          {#each day.egw as block}
            {#if block.content}
              <details class="plan-egw">
                <summary>{block.label}</summary>
                <div class="plan-egw-body">
                  {#each paragraphs(block.content) as paragraph}
                    <p>{paragraph}</p>
                  {/each}
                </div>
              </details>
            {:else if block.chapterId !== undefined && resolveEgwBookFile(block.label)}
              {@const openKey = `${block.label}#${block.chapterId}`}
              <details
                class="plan-egw"
                open={egwOpenKey === openKey}
                ontoggle={(e) => {
                  if ((e.target as HTMLDetailsElement).open) toggleEgw(block.label, block.chapterId);
                  else if (egwOpenKey === openKey) resetEgw();
                }}
              >
                <summary><Library size={14} /> {block.label}</summary>
                <div class="plan-egw-body">
                  {#if egwOpenKey === openKey && egwLoading}
                    <p>Cargando capítulo…</p>
                  {:else if egwOpenKey === openKey && egwMissing}
                    <p>Capítulo no disponible sin conexión.</p>
                  {:else if egwOpenKey === openKey && egwChapter}
                    {#each egwChapter.sections as section}
                      {#if section.title}
                        <h5 class="plan-egw-sec">{section.title}</h5>
                      {/if}
                      {#each paragraphs(section.content ?? '') as paragraph}
                        <p>{paragraph}</p>
                      {/each}
                    {/each}
                  {:else}
                    <p>Pulsa para leer el capítulo completo.</p>
                  {/if}
                </div>
              </details>
            {:else}
              <p class="plan-egw-label">{block.label}</p>
            {/if}
          {/each}
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .plans-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }
  .plan-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px;
    text-align: left;
    cursor: pointer;
  }
  .plan-category {
    font-size: 0.6875rem;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .plan-title {
    font-weight: 800;
    font-size: 1rem;
  }
  .plan-desc {
    font-size: 0.8125rem;
    color: var(--text-muted);
  }
  .plan-open {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8125rem;
    font-weight: 800;
    margin-top: 6px;
  }
  .plan-progress {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 8px;
  }
  .plan-progress-track {
    display: block;
    height: 12px;
    background: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    overflow: hidden;
  }
  .plan-progress-fill {
    display: block;
    height: 100%;
    background: var(--accent-success);
    transition: width 0.15s ease;
  }
  .plan-progress-label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 800;
    color: var(--text-main);
  }
  .plan-day-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-size: 0.8125rem;
    font-weight: 800;
    color: var(--text-main);
    background: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
  }
  .plan-day-toggle:hover {
    background: var(--accent-attention);
    color: var(--on-accent-attention);
  }
  .plan-day-toggle:active {
    transform: translate(2px, 2px);
    box-shadow: var(--shadow-active);
  }
  .plan-day-toggle.is-done {
    background: var(--accent-success);
    color: var(--on-accent-success);
  }
  .plans-loading {
    font-weight: 700;
    padding: 16px 0;
  }
  .plan-detail-title {
    font-size: 1.25rem;
    font-weight: 800;
    margin: 12px 0 2px;
  }
  .plan-day-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 10px 0;
    flex-wrap: wrap;
  }
  .plan-day-title {
    font-size: 1.0625rem;
    font-weight: 800;
    margin: 12px 0 4px;
  }
  .plan-sub {
    font-size: 0.875rem;
    font-weight: 800;
    text-transform: uppercase;
    margin: 14px 0 8px;
  }
  .plan-refs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .plan-ref-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 2px solid var(--border-color);
    background: var(--accent-attention);
    color: var(--on-accent-attention);
    font-weight: 800;
    font-size: 0.8125rem;
    padding: 6px 10px;
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
  }
  .plan-egw {
    border: 2px solid var(--border-color);
    margin-top: 8px;
    background: var(--bg-surface);
  }
  .plan-egw summary {
    cursor: pointer;
    font-weight: 800;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .plan-egw-body {
    padding: 0 12px 12px;
    font-size: 0.875rem;
    line-height: 1.7;
    max-width: 65ch;
  }
  .plan-egw-sec {
    font-weight: 800;
    margin: 10px 0 4px;
  }
  .plan-egw-label {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-muted);
  }
</style>
