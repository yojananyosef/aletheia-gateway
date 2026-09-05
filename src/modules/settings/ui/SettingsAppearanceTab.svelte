<script lang="ts">
  import type { ThemeMode, AppFontFamily } from '../domain/UserSettings';

  interface Props {
    theme: ThemeMode;
    fontFamily: AppFontFamily;
    onThemeChange: (mode: ThemeMode) => void;
    onFontChange: (font: AppFontFamily) => void;
  }

  let { theme, fontFamily, onThemeChange, onFontChange }: Props = $props();
</script>

<div class="settings-section">
  <h3 class="section-title">Tema Visual</h3>
  <p class="section-desc">Selecciona la paleta y contraste para tus sesiones de lectura.</p>

  <div class="theme-options-grid">
    <button
      type="button"
      class="theme-card {theme === 'standard' ? 'is-selected' : ''}"
      onclick={() => onThemeChange('standard')}
    >
      <div class="theme-preview standard">
        <span class="theme-badge-demo">Aa</span>
      </div>
      <span class="theme-name font-bold">Estándar Neobrutalista</span>
      <span class="theme-sub">Alto contraste y acentos vivos</span>
    </button>

    <button
      type="button"
      class="theme-card {theme === 'calm' ? 'is-selected' : ''}"
      onclick={() => onThemeChange('calm')}
    >
      <div class="theme-preview calm">
        <span class="theme-badge-demo">Aa</span>
      </div>
      <span class="theme-name font-bold">Modo Calma</span>
      <span class="theme-sub">Marfil suave anti-fatiga visual y dislexia</span>
    </button>

    <button
      type="button"
      class="theme-card {theme === 'high-contrast' ? 'is-selected' : ''}"
      onclick={() => onThemeChange('high-contrast')}
    >
      <div class="theme-preview high-contrast">
        <span class="theme-badge-demo">Aa</span>
      </div>
      <span class="theme-name font-bold">Alto Contraste</span>
      <span class="theme-sub">21:1 máximo contraste para baja visión</span>
    </button>
  </div>

  <h3 class="section-title" style="margin-top: 20px;">Tipografía del Sistema</h3>
  <p class="section-desc">Elige la fuente base para lectura continua. Se aplica instantáneamente y se guarda en tu respaldo.</p>

  <div class="font-options-grid">
    <button
      type="button"
      class="font-card {fontFamily === 'inter' ? 'is-selected' : ''}"
      onclick={() => onFontChange('inter')}
    >
      <span class="font-preview" style="font-family: 'Inter', sans-serif;">Inter Aa</span>
      <span class="theme-name font-bold">Inter</span>
      <span class="theme-sub">Sans moderna, lectura neutra (por defecto)</span>
    </button>
    <button
      type="button"
      class="font-card {fontFamily === 'lexend' ? 'is-selected' : ''}"
      onclick={() => onFontChange('lexend')}
    >
      <span class="font-preview" style="font-family: 'Lexend', sans-serif;">Lexend Aa</span>
      <span class="theme-name font-bold">Lexend</span>
      <span class="theme-sub">Anti-dislexia, espaciado generoso</span>
    </button>
    <button
      type="button"
      class="font-card {fontFamily === 'mono' ? 'is-selected' : ''}"
      onclick={() => onFontChange('mono')}
    >
      <span class="font-preview" style="font-family: 'JetBrains Mono', monospace;">Mono Aa</span>
      <span class="theme-name font-bold">JetBrains Mono</span>
      <span class="theme-sub">Monoespaciada, foco técnico</span>
    </button>
    <button
      type="button"
      class="font-card {fontFamily === 'syne' ? 'is-selected' : ''}"
      onclick={() => onFontChange('syne')}
    >
      <span class="font-preview" style="font-family: 'Syne', sans-serif;">Syne Aa</span>
      <span class="theme-name font-bold">Syne</span>
      <span class="theme-sub">Display contundente, titulares</span>
    </button>
  </div>
</div>
