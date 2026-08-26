<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import Sidebar from './Sidebar.svelte';
  import Topbar from './Topbar.svelte';
  import NeoTooltip from './NeoTooltip.svelte';

  interface Props {
    activeView: 'home' | 'reader' | 'concordance' | 'devotionals';
    bookmarkCount?: number;
    onNavigate: (view: 'home' | 'reader' | 'concordance' | 'devotionals') => void;
    onOpenBookmarks?: () => void;
    onOpenSettings?: () => void;
    children?: Snippet;
  }

  let {
    activeView = 'home',
    bookmarkCount = 0,
    onNavigate,
    onOpenBookmarks,
    onOpenSettings,
    children,
  }: Props = $props();

  let isCollapsed = $state(false);
  let mobileOpen = $state(false);
  let isCalmMode = $state(false);

  onMount(() => {
    try {
      const savedCalm = localStorage.getItem('alethia_calm_mode');
      if (savedCalm === 'true') {
        isCalmMode = true;
        document.body.classList.add('mode-calm');
      }
    } catch {
      // Ignore localStorage restrictions if any
    }
  });

  function handleToggleCalmMode() {
    isCalmMode = !isCalmMode;
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('mode-calm', isCalmMode);
    }
    try {
      localStorage.setItem('alethia_calm_mode', String(isCalmMode));
    } catch {
      // Ignore
    }
  }

  function handleToggleSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      mobileOpen = !mobileOpen;
    } else {
      isCollapsed = !isCollapsed;
    }
  }

  function handleCloseMobile() {
    mobileOpen = false;
  }
</script>

<div class="app-layout-shell">
  <!-- Global Neobrutalist Tooltip Component -->
  <NeoTooltip />

  <!-- Mobile backdrop overlay -->
  {#if mobileOpen}
    <div
      class="neo-sidebar-backdrop"
      tabindex="-1"
      role="button"
      aria-label="Cerrar barra lateral"
      onclick={handleCloseMobile}
      onkeydown={(e) => e.key === 'Escape' && handleCloseMobile()}
    ></div>
  {/if}

  <!-- Unified Sidebar -->
  <Sidebar
    {activeView}
    {onNavigate}
    isOpen={mobileOpen}
    {isCollapsed}
    {bookmarkCount}
    onClose={handleCloseMobile}
    onToggleCollapse={handleToggleSidebar}
    {onOpenBookmarks}
    {onOpenSettings}
  />

  <!-- Main Inset Container with Topbar and Scrollable Main View -->
  <div class="neo-main-inset {isCollapsed ? 'is-sidebar-collapsed' : ''}">
    <Topbar
      view={activeView}
      {isCollapsed}
      menuOpen={mobileOpen}
      {isCalmMode}
      onToggleSidebar={handleToggleSidebar}
      onToggleCalmMode={handleToggleCalmMode}
    />

    <main class="modern-main">
      {@render children?.()}
    </main>
  </div>
</div>
