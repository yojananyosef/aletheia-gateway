<script lang="ts">
  import type { Snippet } from 'svelte';
  import Sidebar from './Sidebar.svelte';
  import Topbar from './Topbar.svelte';

  interface Props {
    activeView: 'home' | 'reader';
    onNavigate: (view: 'home' | 'reader') => void;
    children?: Snippet;
  }

  let { activeView = 'home', onNavigate, children }: Props = $props();

  let isCollapsed = $state(false);
  let mobileOpen = $state(false);

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
    onClose={handleCloseMobile}
    onToggleCollapse={handleToggleSidebar}
  />

  <!-- Main Inset Container with Topbar and Main view -->
  <div class="neo-main-inset">
    <Topbar
      view={activeView}
      {isCollapsed}
      menuOpen={mobileOpen}
      onToggleSidebar={handleToggleSidebar}
    />

    <main class="modern-main">
      {@render children?.()}
    </main>
  </div>
</div>
