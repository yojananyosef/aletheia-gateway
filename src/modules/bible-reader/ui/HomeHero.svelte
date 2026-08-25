<script lang="ts">
  import { Search, BookOpen, ChevronDown } from 'lucide-svelte';
  import FontSizeSelector, { type FontSizeOption } from './FontSizeSelector.svelte';

  interface Props {
    query: string;
    fontSize?: FontSizeOption;
    onSearch: (event?: Event) => void;
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

  function handleSubmit(event: Event) {
    event.preventDefault();
    onSearch(event);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSearch(event);
    }
  }
</script>

<section class="home-top-search-section">
  <!-- Wide Search Bar with Enter key support -->
  <form class="search-form home-search-bar" onsubmit={handleSubmit}>
    <div class="search-input-wrapper">
      <Search size={18} class="search-icon" />
      <input
        type="text"
        aria-label="Buscar un pasaje o tema"
        value={query}
        oninput={(e) => onQueryChange((e.target as HTMLInputElement).value)}
        onkeydown={handleKeyDown}
        placeholder="Ingrese pasaje, palabra clave o tema (ej. Salmos 42, Juan 3:16)..."
      />
    </div>
    <button type="submit" onclick={handleSubmit}>Buscar</button>
  </form>

  <!-- Quick Sub-Toolbar (BibleGateway style: Book Selector & Font Size) -->
  <div class="home-sub-toolbar">
    <button
      type="button"
      class="home-sub-btn"
      data-tooltip="Abrir lista de libros bíblicos"
      onclick={onOpenBookModal}
    >
      <BookOpen size={16} />
      <span class="hidden sm:inline">Lista de libros bíblicos</span>
      <span class="sm:hidden">Libros bíblicos</span>
      <ChevronDown size={14} />
    </button>

    <FontSizeSelector
      currentSize={fontSize}
      onSizeChange={onFontSizeChange}
    />
  </div>
</section>
