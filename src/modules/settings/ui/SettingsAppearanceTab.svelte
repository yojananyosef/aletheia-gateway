<script lang="ts">
  import type { ThemeMode, AppFontFamily, BionicLevel } from '../domain/UserSettings';

  interface Props {
    theme: ThemeMode;
    calmMode?: boolean;
    fontFamily: AppFontFamily;
    bionic?: BionicLevel;
    ruler?: boolean;
    redLetters?: boolean;
    onThemeChange: (mode: ThemeMode) => void;
    onCalmChange?: (on: boolean) => void;
    onFontChange: (font: AppFontFamily) => void;
    onBionicChange?: (level: BionicLevel) => void;
    onRulerChange?: (on: boolean) => void;
    onRedLettersChange?: (on: boolean) => void;
  }

  let {
    theme,
    calmMode = false,
    fontFamily,
    bionic = 'off',
    ruler = false,
    redLetters = false,
    onThemeChange,
    onCalmChange,
    onFontChange,
    onBionicChange,
    onRulerChange,
    onRedLettersChange,
  }: Props = $props();
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
      <span class="theme-sub">Amarillo vivo + activo cyan, AAA</span>
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
      <span class="theme-sub">Blanco/negro + amarillo puro, AAA</span>
    </button>

    <button
      type="button"
      class="theme-card {theme === 'sepia' ? 'is-selected' : ''}"
      onclick={() => onThemeChange('sepia')}
    >
      <div class="theme-preview sepia">
        <span class="theme-badge-demo">Aa</span>
      </div>
      <span class="theme-name font-bold">Sepia</span>
      <span class="theme-sub">Tono cálido para lectura prolongada</span>
    </button>

    <button
      type="button"
      class="theme-card {theme === 'dark' ? 'is-selected' : ''}"
      onclick={() => onThemeChange('dark')}
    >
      <div class="theme-preview dark">
        <span class="theme-badge-demo">Aa</span>
      </div>
      <span class="theme-name font-bold">Oscuro</span>
      <span class="theme-sub">Amarillo con tinta oscura, AAA</span>
    </button>

    <button
      type="button"
      class="theme-card {theme === 'oled' ? 'is-selected' : ''}"
      onclick={() => onThemeChange('oled')}
    >
      <div class="theme-preview oled">
        <span class="theme-badge-demo">Aa</span>
      </div>
      <span class="theme-name font-bold">OLED</span>
      <span class="theme-sub">Negro puro, ahorro de batería</span>
    </button>
  </div>

  <div class="font-card" style="margin-top: 12px;">
    <span class="theme-name font-bold">Modo Calma (tenue global)</span>
    <span class="theme-sub">Suaviza cualquier tema: tipografía Lexend, ritmo amplio y saturación tenue. Se combina con oscuro, OLED, sepia y alto contraste.</span>
    <div class="reading-toggle-row">
      <button
        type="button"
        class="neo-btn-mini {calmMode ? 'is-selected' : ''}"
        aria-pressed={calmMode}
        onclick={() => onCalmChange?.(!calmMode)}
      >{calmMode ? 'Activado' : 'Activar'}</button>
    </div>
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
    <button
      type="button"
      class="font-card {fontFamily === 'opendyslexic' ? 'is-selected' : ''}"
      onclick={() => onFontChange('opendyslexic')}
    >
      <span class="font-preview" style="font-family: 'OpenDyslexic', 'Lexend', sans-serif;">OpenDyslexic Aa</span>
      <span class="theme-name font-bold">OpenDyslexic</span>
      <span class="theme-sub">Diseñada contra la dislexia (requiere la fuente instalada)</span>
    </button>
  </div>

  <h3 class="section-title" style="margin-top: 20px;">Ayudas de lectura</h3>
  <p class="section-desc">Biónica, regla guía y palabras de Cristo. Se guardan en tu respaldo.</p>

  <div class="font-options-grid">
    <div class="font-card">
      <span class="theme-name font-bold">Lectura biónica</span>
      <span class="theme-sub">Resalta el inicio de cada palabra</span>
      <div class="reading-toggle-row">
        {#each [['off', 'Off'], ['leve', 'Leve'], ['fuerte', 'Fuerte']] as [val, label]}
          <button
            type="button"
            class="neo-btn-mini {(bionic ?? 'off') === val ? 'is-selected' : ''}"
            onclick={() => onBionicChange?.(val as BionicLevel)}
          >{label}</button>
        {/each}
      </div>
    </div>
    <div class="font-card">
      <span class="theme-name font-bold">Regla de lectura</span>
      <span class="theme-sub">Guía horizontal que sigue el cursor</span>
      <div class="reading-toggle-row">
        <button
          type="button"
          class="neo-btn-mini {ruler ? 'is-selected' : ''}"
          aria-pressed={ruler}
          onclick={() => onRulerChange?.(!ruler)}
        >{ruler ? 'Activada' : 'Activar'}</button>
      </div>
    </div>
    <div class="font-card">
      <span class="theme-name font-bold">Palabras de Cristo</span>
      <span class="theme-sub">Rojo sobre dichos de Jesús (cobertura: Mateo)</span>
      <div class="reading-toggle-row">
        <button
          type="button"
          class="neo-btn-mini {redLetters ? 'is-selected' : ''}"
          aria-pressed={redLetters}
          onclick={() => onRedLettersChange?.(!redLetters)}
        >{redLetters ? 'Activadas' : 'Activar'}</button>
      </div>
    </div>
  </div>
</div>

<style>
  /* Previews de tema en settings.css global (única fuente). */
  .reading-toggle-row {
    display: flex;
    gap: 6px;
    margin-top: 8px;
    flex-wrap: wrap;
  }
</style>
