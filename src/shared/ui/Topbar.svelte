<script lang="ts">
  import { PanelLeft, PanelLeftClose, Menu, X, Share2, Settings2 } from 'lucide-svelte';

  interface Props {
    view: 'home' | 'reader';
    isCollapsed: boolean;
    menuOpen: boolean;
    onToggleSidebar: () => void;
  }

  let {
    view = 'home',
    isCollapsed = false,
    menuOpen = false,
    onToggleSidebar,
  }: Props = $props();
</script>

<header class="app-topbar sticky top-0 z-30">
  <button
    type="button"
    class="topbar-btn sidebar-trigger-btn"
    aria-label={isCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
    title={isCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
    onclick={onToggleSidebar}
  >
    <span class="trigger-icon-desktop">
      {#if isCollapsed}
        <PanelLeft size={19} />
      {:else}
        <PanelLeftClose size={19} />
      {/if}
    </span>
    <span class="trigger-icon-mobile">
      {#if menuOpen}
        <X size={19} />
      {:else}
        <Menu size={19} />
      {/if}
    </span>
  </button>

  <div class="topbar-rule"></div>
  <span class="topbar-title">{view === 'home' ? 'Inicio' : 'Lectura bíblica'}</span>

  <div class="topbar-actions">
    <button type="button" class="topbar-btn" title="Compartir" aria-label="Compartir">
      <Share2 size={16} />
    </button>
    <button type="button" class="topbar-btn" title="Configuración" aria-label="Configuración">
      <Settings2 size={16} />
    </button>
  </div>
</header>
