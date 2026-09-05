<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import Sidebar from './Sidebar.svelte';
  import Topbar from './Topbar.svelte';
  import NeoTooltip from './NeoTooltip.svelte';
  import { readStorageWithLegacy } from '../utils/storage';

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

  const FONT_BODY_MAP: Record<string, string> = {
    inter: "'Inter', 'DM Sans', system-ui, sans-serif",
    lexend: "'Lexend', 'Verdana', sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
    syne: "'Syne', 'Archivo Black', sans-serif",
  };

  function applyThemeClass(mode: string) {
    if (typeof document === 'undefined') return;
    document.body.classList.remove('mode-calm', 'mode-high-contrast');
    if (mode === 'calm') document.body.classList.add('mode-calm');
    else if (mode === 'high-contrast') document.body.classList.add('mode-high-contrast');
  }

  function applyFontClass(font: string) {
    if (typeof document === 'undefined') return;
    document.body.classList.remove('font-inter', 'font-lexend', 'font-mono', 'font-syne');
    document.body.classList.add(`font-${font}`);
    if (FONT_BODY_MAP[font]) {
      document.documentElement.style.setProperty('--font-body', FONT_BODY_MAP[font]);
    }
  }

  onMount(() => {
    try {
      // Prefer UserSettings (Fase 1) with fallback to legacy aletheia_calm_mode
      // (y a las claves pre-v0.11 "alethia_*", migradas con fallback)
      const raw = readStorageWithLegacy('aletheia_user_settings', 'alethia_user_settings');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.theme) {
          applyThemeClass(s.theme);
          isCalmMode = s.theme === 'calm';
        } else {
          const savedCalm = readStorageWithLegacy('aletheia_calm_mode', 'alethia_calm_mode');
          if (savedCalm === 'true') {
            isCalmMode = true;
            applyThemeClass('calm');
          }
        }
        if (s.fontFamily) applyFontClass(s.fontFamily);
      } else {
        const savedCalm = readStorageWithLegacy('aletheia_calm_mode', 'alethia_calm_mode');
        if (savedCalm === 'true') {
          isCalmMode = true;
          document.body.classList.add('mode-calm');
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
      applyThemeClass(isCalmMode ? 'calm' : 'standard');
    }
    try {
      localStorage.setItem('aletheia_calm_mode', String(isCalmMode));
      // keep UserSettings in sync
      const raw = localStorage.getItem('aletheia_user_settings');
      if (raw) {
        const s = JSON.parse(raw);
        s.theme = isCalmMode ? 'calm' : 'standard';
        s.calmMode = isCalmMode;
        localStorage.setItem('aletheia_user_settings', JSON.stringify(s));
      } else {
        localStorage.setItem('aletheia_user_settings', JSON.stringify({
          theme: isCalmMode ? 'calm' : 'standard',
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
