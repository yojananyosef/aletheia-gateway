<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Snippet } from 'svelte';
  import Sidebar from './Sidebar.svelte';
  import Topbar from './Topbar.svelte';
  import NeoTooltip from './NeoTooltip.svelte';
  import { readStorageWithLegacy } from '../utils/storage';
  import { applyFontClass, applyThemeClass, applyCalmOverlay, applyReadingClass } from '../utils/appearance';
  import type { AppView } from './AppView';

  interface Props {
    activeView: AppView;
    bookmarkCount?: number;
    onNavigate: (view: AppView) => void;
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
  let isMobile = $state(false);
  let isCalmMode = $state(false);
  let baseTheme = $state('standard');

  /**
   * El shell tiene dos estados de barra lateral: "encogida" en escritorio y
   * "cajón abierto" en móvil. Se seguían separando con un `window.innerWidth`
   * leído en cada clic, que se queda obsoleto al redimensionar la ventana.
   * matchMedia mantiene el breakpoint al día y, al cruzarlo, deja el cajón
   * cerrado para no dejarlo tapando el contenido sin que nadie lo haya abierto.
   */
  let mobileQuery: MediaQueryList | null = null;

  function syncBreakpoint(matches: boolean) {
    if (isMobile === matches) return;
    isMobile = matches;
    if (matches) mobileOpen = false;
  }

  function handleBreakpointChange(e: MediaQueryListEvent) {
    syncBreakpoint(e.matches);
  }

  onMount(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      mobileQuery = window.matchMedia('(max-width: 768px)');
      syncBreakpoint(mobileQuery.matches);
      mobileQuery.addEventListener('change', handleBreakpointChange);
    }

    const onMouse = (e: MouseEvent) => {
      if (typeof document === 'undefined') return;
      if (!document.body.classList.contains('ruler-on')) return;
      const ruler = document.querySelector<HTMLElement>('.reading-ruler');
      if (ruler) ruler.style.top = `${e.clientY - 16}px`;
    };
    window.addEventListener('mousemove', onMouse);    try {
      // Prefer UserSettings (Fase 1) with fallback to legacy aletheia_calm_mode
      // (y a las claves pre-v0.11 "alethia_*", migradas con fallback).
      // Calma = overlay global `calm-on` combinado con el tema base.
      const raw = readStorageWithLegacy('aletheia_user_settings', 'alethia_user_settings');
      if (raw) {
        const s = JSON.parse(raw);
        const theme = s.theme === 'calm' ? 'standard' : (s.theme ?? 'standard');
        const calm = s.theme === 'calm' || s.calmMode === true;
        baseTheme = theme;
        isCalmMode = calm;
        applyThemeClass(theme, { calm });
        if (s.fontFamily) applyFontClass(s.fontFamily);
        applyReadingClass({ bionic: s.bionic, ruler: s.ruler, redLetters: s.redLetters });
      } else {
        const savedCalm = readStorageWithLegacy('aletheia_calm_mode', 'alethia_calm_mode');
        if (savedCalm === 'true') {
          isCalmMode = true;
          applyThemeClass('standard', { calm: true });
        }
        // default font inter
        applyFontClass('inter');
      }
    } catch {
      // Ignore
    }
  });

  function handleToggleCalmMode() {
    isCalmMode = !isCalmMode;
    if (typeof document !== 'undefined') {
      applyCalmOverlay(isCalmMode);
    }
    try {
      localStorage.setItem('aletheia_calm_mode', String(isCalmMode));
      // keep UserSettings in sync (calma como overlay, sin destruir el tema base)
      const raw = localStorage.getItem('aletheia_user_settings');
      if (raw) {
        const s = JSON.parse(raw);
        const theme = (s.theme === 'calm' ? 'standard' : s.theme) ?? baseTheme;
        baseTheme = theme;
        s.theme = theme;
        s.calmMode = isCalmMode;
        localStorage.setItem('aletheia_user_settings', JSON.stringify(s));
      } else {
        localStorage.setItem('aletheia_user_settings', JSON.stringify({
          theme: baseTheme,
          fontFamily: 'inter',
          defaultTranslation: 'RV1909',
          calmMode: isCalmMode
        }));
      }
    } catch {
      // Ignore
    }
  }

  function handleToggleSidebar() {
    if (isMobile) {
      mobileOpen = !mobileOpen;
    } else {
      isCollapsed = !isCollapsed;
    }
  }

  function handleCloseMobile() {
    mobileOpen = false;
  }

  onDestroy(() => {
    mobileQuery?.removeEventListener('change', handleBreakpointChange);
  });
</script>

<div class="app-layout-shell">
  <!-- Global Neobrutalist Tooltip Component -->
  <NeoTooltip />

  <!-- Regla de lectura global (visible con body.ruler-on, todas las vistas) -->
  <div class="reading-ruler" aria-hidden="true"></div>

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
      {isMobile}
      {isCalmMode}
      onToggleSidebar={handleToggleSidebar}
      onToggleCalmMode={handleToggleCalmMode}
    />

    <main class="modern-main">
      {@render children?.()}
    </main>
  </div>
</div>
