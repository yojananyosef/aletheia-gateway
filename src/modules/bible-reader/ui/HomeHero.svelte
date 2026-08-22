<script lang="ts">
  import { Search, BookOpen, ChevronDown } from 'lucide-svelte';
  import FontSizeSelector, { type FontSizeOption } from './FontSizeSelector.svelte';

  interface Props {
    query: string;
    fontSize?: FontSizeOption;
    onSearch: (event: SubmitEvent) => void;
    onQueryChange: (val: string) => void;
    onOpenBookModal: () => void;
    onFontSizeChange: (size: FontSizeOption) => void;
  }

  let {
    query = '',
    fontSize = 'medium',
    onSearch,
    onQueryChange,
    onOpenBookModal,
    onFontSizeChange,
  }: Props = $props();
</script>

<section class="home-top-search-section">
  <!-- Wide Search Bar -->
  <form class="search-form home-search-bar" onsubmit={onSearch}>
    <div class="search-input-wrapper">
      <Search size={18} class="search-icon" />
      <input
        type="text"
        aria-label="Buscar un pasaje o tema"
        value={query}
        oninput={(e) => onQueryChange((e.target as HTMLInputElement).value)}
        placeholder="Ingrese pasaje, palabra clave o tema (ej. Salmos 42, Juan 3:16)..."
      />
    </div>
    <button type="submit">Buscar</button>
  </form>

  <!-- Quick Sub-Toolbar (BibleGateway style: Book Selector & Font Size) -->
  <div class="home-sub-toolbar">
    <button
      type="button"
      class="home-sub-btn"
      title="Abrir lista de libros bíblicos"
      onclick={onOpenBookModal}
    >
      <BookOpen size={16} />
      <span>Lista de libros bíblicos</span>
      <ChevronDown size={14} />
    </button>

    <FontSizeSelector
      currentSize={fontSize}
      onSizeChange={onFontSizeChange}
    />
  </div>
</section>
