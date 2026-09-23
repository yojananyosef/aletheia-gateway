<script lang="ts">
  import { ListChecks } from 'lucide-svelte';
  import ReadingPlansSection from './ReadingPlansSection.svelte';

  interface Props {
    onSelectPassage: (ref: string) => void;
  }

  let { onSelectPassage }: Props = $props();
</script>

<div class="plans-view">
  <div class="plans-header-card neo-card">
    <div class="flex items-center gap-3">
      <div class="plans-icon-badge">
        <ListChecks size={24} />
      </div>
      <div>
        <h1 class="plans-main-title">Planes de lectura</h1>
        <p class="plans-subtitle">Recorridos temáticos en español, día a día</p>
      </div>
    </div>
  </div>

  <ReadingPlansSection {onSelectPassage} />
</div>

<style>
  .plans-view {
    max-width: 920px;
    margin: 0 auto;
    padding: 20px 16px 60px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .plans-header-card {
    padding: 16px;
  }
  .plans-icon-badge {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    background: var(--accent-attention);
    color: var(--on-accent-attention);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
  }
  .plans-main-title {
    font-size: 1.25rem;
    font-weight: 900;
    margin: 0;
  }
  .plans-subtitle {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-muted);
    margin: 0;
  }
</style>
