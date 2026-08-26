<script lang="ts">
  import { PanelLeft, PanelLeftClose, Menu, X, Sparkles } from 'lucide-svelte';

  interface Props {
    view: 'home' | 'reader' | 'concordance' | 'devotionals';
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
    data-tooltip={isCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
    data-tooltip-pos="bottom"
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
  <span class="topbar-title">
    {view === 'home' ? 'Inicio' : view === 'concordance' ? 'Concordancia' : view === 'devotionals' ? 'Devocional Diario' : 'Lectura bíblica'}
  </span>

  <div class="topbar-actions">
    <button
      type="button"
      class="topbar-btn {isCalmMode ? 'calm-active-btn' : ''}"
      data-tooltip={isCalmMode ? 'Modo Calma & Dislexia: Activado' : 'Activar Modo Calma & Dislexia (Tipografía y paleta anti-estrés)'}
      data-tooltip-pos="bottom"
      aria-label="Alternar Modo Calma y Dislexia"
      onclick={onToggleCalmMode}
    >
      <Sparkles size={18} />
    </button>
  </div>
</header>
