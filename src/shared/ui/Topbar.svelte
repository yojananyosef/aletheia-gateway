<script lang="ts">
  import { PanelLeft, PanelLeftClose, Menu, X, Share2, Sparkles } from 'lucide-svelte';

  interface Props {
    view: 'home' | 'reader';
    isCollapsed: boolean;
    menuOpen: boolean;
    isCalmMode: boolean;
    onToggleSidebar: () => void;
    onToggleCalmMode: () => void;
  }

  let {
    view = 'home',
    isCollapsed = false,
    menuOpen = false,
    isCalmMode = false,
    onToggleSidebar,
    onToggleCalmMode,
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
    <button
      type="button"
      class="topbar-btn {isCalmMode ? 'calm-active-btn' : ''}"
      title={isCalmMode ? 'Modo Calma & Dislexia: Activado (Haz clic para desactivar)' : 'Activar Modo Calma & Dislexia (Tipografía suave y paleta anti-estrés)'}
      aria-label="Alternar Modo Calma y Dislexia"
      onclick={onToggleCalmMode}
    >
      <Sparkles size={18} />
    </button>

    <button type="button" class="topbar-btn" title="Compartir pasaje" aria-label="Compartir">
      <Share2 size={16} />
    </button>
  </div>
</header>
