<script lang="ts">
  import { Sparkles, BookOpen, Search } from 'lucide-svelte';

  interface Props {
    query: string;
    onSearch: (event: SubmitEvent) => void;
    onQueryChange: (val: string) => void;
    onQuickSelect: (passage: string) => void;
  }

  let { query = '', onSearch, onQueryChange, onQuickSelect }: Props = $props();
</script>

<section class="home-hero">
  <div class="hero-header-row">
    <div class="hero-text-col">
      <div class="eyebrow">
        <Sparkles size={16} />
        TU LUGAR PARA ENCONTRAR ESPERANZA
      </div>
      <h1>Explora la Palabra.</h1>
      <p>Busca, lee y descubre la Biblia en el idioma que habla a tu corazón.</p>
    </div>

    <div class="hero-orbit" aria-hidden="true">
      <BookOpen size={32} />
    </div>
  </div>

  <form class="search-form" onsubmit={onSearch}>
    <div class="search-input-wrapper">
      <Search size={18} class="search-icon" />
      <input
        type="text"
        aria-label="Buscar un pasaje"
        value={query}
        oninput={(e) => onQueryChange((e.target as HTMLInputElement).value)}
        placeholder="Buscar un pasaje, palabra o tema (ej. Juan 3:16)"
      />
    </div>
    <button type="submit">Buscar</button>
  </form>

  <div class="quick-links">
    <span class="font-bold">Prueba:</span>
    <button type="button" onclick={() => onQuickSelect('Juan 3:16')}>Juan 3:16</button>
    <button type="button" onclick={() => onQuickSelect('Salmos 23')}>Salmos 23</button>
    <button type="button" onclick={() => onQuickSelect('Proverbios 3:5')}>Proverbios 3:5</button>
  </div>
</section>
