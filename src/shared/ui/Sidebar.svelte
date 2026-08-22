<script lang="ts">
  import {
    Home,
    BookOpen,
    Search,
    ListChecks,
    Heart,
    Headphones,
    Library,
    Settings2,
  } from 'lucide-svelte';

  interface Props {
    activeView: 'home' | 'reader';
    onNavigate: (view: 'home' | 'reader') => void;
    isOpen: boolean;
    isCollapsed: boolean;
    onClose: () => void;
    onToggleCollapse?: () => void;
  }

  let {
    activeView = 'home',
    onNavigate,
    isOpen = false,
    isCollapsed = false,
    onClose,
  }: Props = $props();

  const mainItems = [
    { title: 'Inicio', icon: Home, view: 'home' as const },
    { title: 'Leer la Biblia', icon: BookOpen, view: 'reader' as const },
  ];

  const exploreItems = [
    { title: 'Planes de lectura', icon: ListChecks },
    { title: 'Devocionales', icon: Heart },
    { title: 'Audio Biblia', icon: Headphones },
    { title: 'Recursos', icon: Library },
  ];

  function handleSelect(view: 'home' | 'reader') {
    onNavigate(view);
    onClose();
  }
</script>

<aside class="neo-sidebar {isCollapsed && !isOpen ? 'is-collapsed' : ''} {isOpen ? 'is-open' : ''}">
  <div class="neo-sidebar-header">
    <button
      type="button"
      class="neo-brand-btn {isCollapsed && !isOpen ? 'is-collapsed-btn' : ''}"
      title="AlethiaGateway - Inicio"
      onclick={() => handleSelect('home')}
    >
      <span class="neo-brand-badge">A</span>
      {#if !isCollapsed || isOpen}
        <div class="flex flex-col text-left leading-tight overflow-hidden">
          <span class="font-bold text-sm truncate">Alethia<span class="text-[var(--neo-blue)]">Gateway</span></span>
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
          class="neo-nav-button {activeView === item.view && item.title !== 'Buscar pasajes' ? 'is-active' : ''} {isCollapsed && !isOpen ? 'is-collapsed-btn' : ''}"
          title={item.title}
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
      {#each exploreItems as item}
        {@const Icon = item.icon}
        <button
          type="button"
          class="neo-nav-button {isCollapsed && !isOpen ? 'is-collapsed-btn' : ''}"
          title={item.title}
        >
          <Icon size={20} class="shrink-0" />
          {#if !isCollapsed || isOpen}
            <span class="truncate">{item.title}</span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <div class="neo-sidebar-footer">
    <button
      type="button"
      class="neo-nav-button {isCollapsed && !isOpen ? 'is-collapsed-btn' : ''}"
      title="Configuración"
    >
      <Settings2 size={20} class="shrink-0" />
      {#if !isCollapsed || isOpen}
        <span class="truncate">Configuración</span>
      {/if}
    </button>
  </div>
</aside>
