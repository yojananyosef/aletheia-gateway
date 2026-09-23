<script lang="ts">
  import { onMount } from 'svelte';
  import { ListChecks, ChevronLeft, BookOpen } from 'lucide-svelte';
  import type { PlanDay, PlanIndexEntry } from '../domain/ReadingPlan';
  import { JsonPlanRepository } from '../infrastructure/JsonPlanRepository';

  interface Props {
    onSelectPassage: (ref: string) => void;
  }

  let { onSelectPassage }: Props = $props();

  const repo = new JsonPlanRepository();

  let index = $state<PlanIndexEntry[]>([]);
  let selectedId = $state<string | null>(null);
  let selectedDay = $state(1);
  let day = $state<PlanDay | null>(null);
  let isLoadingIndex = $state(true);
  let isLoadingDay = $state(false);

  onMount(async () => {
    try {
      index = await repo.getIndex();
    } finally {
      isLoadingIndex = false;
    }
  });

  async function openPlan(id: string) {
    selectedId = id;
    selectedDay = 1;
    await loadDay(id, 1);
  }

  async function loadDay(id: string, d: number) {
    isLoadingDay = true;
    try {
      day = await repo.getDay(id, d);
    } finally {
      isLoadingDay = false;
    }
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

  let selectedEntry = $derived(index.find((e) => e.id === selectedId) ?? null);
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
          <button type="button" class="plan-card neo-card" onclick={() => openPlan(entry.id)}>
            <span class="plan-category">{entry.category} • {entry.durationDays} días</span>
            <span class="plan-title">{entry.title}</span>
            <span class="plan-desc">{entry.description}</span>
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
      <p class="plan-desc">Día {selectedDay} de {selectedEntry.durationDays}</p>

      <div class="flex items-center gap-2 plan-day-nav">
        <button type="button" class="neo-btn-nav" disabled={selectedDay <= 1} onclick={prevDay}>
          <ChevronLeft size={16} /> Anterior
        </button>
        <button
          type="button"
          class="neo-btn-nav"
          disabled={selectedDay >= selectedEntry.durationDays}
          onclick={() => nextDay(selectedEntry!)}
        >
          Siguiente <ChevronLeft size={16} class="rotate-180" />
        </button>
      </div>

      {#if isLoadingDay}
        <p class="plans-loading">Cargando día {selectedDay}…</p>
      {:else if !day}
        <p class="plans-loading">Este día aún no tiene contenido.</p>
      {:else}
        <h3 class="plan-day-title">{day.title}</h3>
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
            <details class="plan-egw">
              <summary>{block.label}</summary>
              <div class="plan-egw-body">
                {#each block.content.split('\n\n') as paragraph}
                  {#if paragraph.trim()}
                    <p>{paragraph.trim()}</p>
                  {/if}
                {/each}
              </div>
            </details>
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
    margin: 10px 0;
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
    font-weight: 800;
    font-size: 0.8125rem;
    padding: 6px 10px;
    box-shadow: 2px 2px 0 var(--border-color);
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
  }
  .plan-egw-body {
    padding: 0 12px 12px;
    font-size: 0.875rem;
    line-height: 1.7;
    max-width: 65ch;
  }
</style>
