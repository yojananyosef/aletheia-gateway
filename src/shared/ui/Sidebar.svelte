<script lang="ts">
  import {
    Home,
    BookOpen,
    Search,
    Bookmark,
    ListChecks,
    Heart,
    Headphones,
    Library,
    Settings2,
  } from 'lucide-svelte';

  interface Props {
    activeView: 'home' | 'reader' | 'concordance' | 'devotionals';
    onNavigate: (view: 'home' | 'reader' | 'concordance' | 'devotionals') => void;
    isOpen: boolean;
    isCollapsed: boolean;
    bookmarkCount?: number;
    onClose: () => void;
    onToggleCollapse?: () => void;
    onOpenBookmarks?: () => void;
    onOpenSettings?: () => void;
  }

  let {
    activeView = 'home',
    onNavigate,
    isOpen = false,
    isCollapsed = false,
    bookmarkCount = 0,
    onClose,
    onOpenBookmarks,
    onOpenSettings,
  }: Props = $props();

  const mainItems = [
    { title: 'Inicio', icon: Home, view: 'home' as const },
    { title: 'Leer la Biblia', icon: BookOpen, view: 'reader' as const },
    { title: 'Concordancia', icon: Search, view: 'concordance' as const },
    { title: 'Devocionales', icon: Heart, view: 'devotionals' as const },
  ];

  const exploreItems = [
    { title: 'Planes de lectura', icon: ListChecks },
    { title: 'Audio Biblia', icon: Headphones },
    { title: 'Recursos', icon: Library },
  ];

  function handleSelect(view: 'home' | 'reader' | 'concordance' | 'devotionals') {
    onNavigate(view);
    onClose();
  }

  function handleOpenSaved() {
    onOpenBookmarks?.();
    onClose();
  }

  function handleOpenSettings() {
    onOpenSettings?.();
    onClose();
  }
</script>

<aside class="neo-sidebar {isCollapsed && !isOpen ? 'is-collapsed' : ''} {isOpen ? 'is-open' : ''}">
  <div class="neo-sidebar-header">
    <button
      type="button"
      class="neo-brand-btn {isCollapsed && !isOpen ? 'is-collapsed-btn' : ''}"
      data-tooltip="AletheiaGateway - Inicio"
      data-tooltip-pos={isCollapsed && !isOpen ? 'bottom' : 'top'}
      onclick={() => handleSelect('home')}
    >
      <span class="neo-brand-badge">A</span>
      {#if !isCollapsed || isOpen}
        <div class="flex flex-col text-left leading-tight overflow-hidden">
          <span class="font-bold text-sm truncate">Aletheia<span class="text-[var(--neo-blue)]">Gateway</span></span>
          <span class="text-xs text-black font-semibold truncate">La verdad en la Palabra</span>
        </div>
      {/if}
    </button>
  </div>

  <div class="neo-sidebar-content">
    <div class="neo-sidebar-section">
      {#if !isCollapsed || isOpen}
        <span class="neo-sidebar-label">Explorar</span>
      {/if}
      {#each mainItems as item}
        {@const Icon = item.icon}
        <button
          type="button"
          class="neo-nav-button {activeView === item.view ? 'is-active' : ''} {isCollapsed && !isOpen ? 'is-collapsed-btn' : ''}"
          data-tooltip={item.title}
          onclick={() => handleSelect(item.view)}
        >
          <Icon size={20} class="shrink-0" />
          {#if !isCollapsed || isOpen}
            <span class="truncate">{item.title}</span>
          {/if}
        </button>
      {/each}
    </div>

    <div class="neo-sidebar-section">
      {#if !isCollapsed || isOpen}
        <span class="neo-sidebar-label">Tu biblioteca</span>
      {/if}

      <!-- Versículos Guardados (Functional) -->
      <button
        type="button"
        class="neo-nav-button {isCollapsed && !isOpen ? 'is-collapsed-btn' : ''}"
        data-tooltip="Versículos guardados ({bookmarkCount})"
        onclick={handleOpenSaved}
      >
        <Bookmark size={20} class="shrink-0" />
        {#if !isCollapsed || isOpen}
          <span class="truncate flex-1 text-left">Versículos guardados</span>
          {#if bookmarkCount > 0}
            <span class="sidebar-count-badge">{bookmarkCount}</span>
          {/if}
        {/if}
      </button>

      {#each exploreItems as item}
        {@const Icon = item.icon}
        <button
          type="button"
          class="neo-nav-button is-disabled {isCollapsed && !isOpen ? 'is-collapsed-btn' : ''}"
          data-tooltip="{item.title} (Próximamente)"
          disabled
        >
          <Icon size={20} class="shrink-0" />
          {#if !isCollapsed || isOpen}
            <span class="truncate flex-1 text-left">{item.title}</span>
            <span class="sidebar-pending-badge">Pronto</span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <div class="neo-sidebar-footer">
    <button
      type="button"
      class="neo-nav-button {isCollapsed && !isOpen ? 'is-collapsed-btn' : ''}"
      data-tooltip="Configuración"
      onclick={handleOpenSettings}
    >
      <Settings2 size={20} class="shrink-0" />
      {#if !isCollapsed || isOpen}
        <span class="truncate flex-1 text-left">Configuración</span>
      {/if}
    </button>
  </div>
</aside>

<style>
  .sidebar-count-badge {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 800;
    color: var(--text-main);
    background-color: var(--accent-attention);
    border: 1px solid var(--border-color);
    padding: 1px 6px;
    box-shadow: 1px 1px 0 var(--border-color);
    flex-shrink: 0;
  }
</style>
