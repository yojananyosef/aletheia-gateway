<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Settings2,
    X,
    Download,
    Upload,
    Trash2,
    Check,
    AlertTriangle,
    Eye,
    HardDrive,
    Info,
    Palette,
    FileText,
  } from 'lucide-svelte';
  import { LocalStorageSettingsRepository } from '../infrastructure/LocalStorageSettingsRepository';
  import type { ThemeMode, AppFontFamily, UserSettings } from '../domain/UserSettings';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onDataRestored?: () => void;
  }

  let { isOpen = false, onClose, onDataRestored }: Props = $props();

  const repo = new LocalStorageSettingsRepository();

  let activeTab = $state<'appearance' | 'backup' | 'about'>('appearance');
  let settings = $state<UserSettings>(repo.getSettings());
  let feedbackMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
  let showResetConfirm = $state(false);
  let shouldMerge = $state(true);

  let fileInputRef: HTMLInputElement | undefined = $state();

  const FONT_BODY_MAP: Record<AppFontFamily, string> = {
    inter: "'Inter', 'DM Sans', system-ui, sans-serif",
    lexend: "'Lexend', 'Verdana', sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
    syne: "'Syne', 'Archivo Black', sans-serif",
  };

  function applyThemeClass(mode: ThemeMode) {
    if (typeof document === 'undefined') return;
    document.body.classList.remove('mode-calm', 'mode-high-contrast');
    if (mode === 'calm') {
      document.body.classList.add('mode-calm');
      localStorage.setItem('alethia_calm_mode', 'true');
    } else if (mode === 'high-contrast') {
      document.body.classList.add('mode-high-contrast');
      localStorage.setItem('alethia_calm_mode', 'false');
    } else {
      localStorage.setItem('alethia_calm_mode', 'false');
    }
  }

  function applyFontClass(font: AppFontFamily) {
    if (typeof document === 'undefined') return;
    document.body.classList.remove('font-inter', 'font-lexend', 'font-mono', 'font-syne');
    document.body.classList.add(`font-${font}`);
    document.documentElement.style.setProperty('--font-body', FONT_BODY_MAP[font]);
  }

  function applyAppearanceFromSettings(s: UserSettings) {
    applyThemeClass(s.theme);
    applyFontClass(s.fontFamily);
  }

  onMount(() => {
    settings = repo.getSettings();
    applyAppearanceFromSettings(settings);
  });

  function handleThemeChange(mode: ThemeMode) {
    settings.theme = mode;
    const calmFlag = mode === 'calm';
    repo.saveSettings({ theme: mode, calmMode: calmFlag });
    applyThemeClass(mode);
  }

  function handleFontChange(font: AppFontFamily) {
    settings.fontFamily = font;
    repo.saveSettings({ fontFamily: font });
    applyFontClass(font);
  }

  async function handleExport() {
    try {
      const jsonStr = await repo.exportBackup();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const now = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = url;
      link.download = `alethia-backup-${now}.json`;
      link.click();
      URL.revokeObjectURL(url);

      feedbackMessage = {
        type: 'success',
        text: '¡Copia de seguridad descargada exitosamente!',
      };
      setTimeout(() => (feedbackMessage = null), 4000);
    } catch (err) {
      feedbackMessage = {
        type: 'error',
        text: 'Error al exportar los datos.',
      };
    }
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      const result = await repo.importBackup(content, { merge: shouldMerge });
      if (result.success) {
        settings = repo.getSettings();
        applyAppearanceFromSettings(settings);
        feedbackMessage = {
          type: 'success',
          text: `${shouldMerge ? 'Fusionado' : 'Restaurado'} con éxito: ${result.bookmarksCount} marcadores, ${result.notesCount} notas y ${result.highlightsCount} resaltados. ${shouldMerge ? '(Se conservaron tus datos actuales + se añadieron los del backup)' : '(Se reemplazaron tus datos por los del backup)'}`,
        };
        onDataRestored?.();
      } else {
        feedbackMessage = {
          type: 'error',
          text: result.message || 'Error al restaurar archivo.',
        };
      }
      setTimeout(() => (feedbackMessage = null), 5000);
      if (target) target.value = '';
    };
    reader.readAsText(file);
  }

  function handleReset() {
    repo.resetAllData();
    settings = repo.getSettings();
    applyAppearanceFromSettings(settings);
    showResetConfirm = false;
    feedbackMessage = {
      type: 'success',
      text: 'Todos los datos locales han sido restablecidos.',
    };
    onDataRestored?.();
    setTimeout(() => (feedbackMessage = null), 4000);
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <button
    type="button"
    class="settings-backdrop"
    onclick={onClose}
    aria-label="Cerrar ventana de configuración"
  ></button>

  <!-- Modal Container -->
  <div class="settings-modal neo-card" role="dialog" aria-modal="true">
    <!-- Header -->
    <div class="settings-header">
      <div class="flex items-center gap-3">
        <div class="settings-icon-badge">
          <Settings2 size={22} />
        </div>
        <div>
          <h2 class="settings-title">Configuración</h2>
          <span class="settings-subtitle">Preferencias y Copias de Seguridad</span>
        </div>
      </div>
      <button
        type="button"
        class="neo-btn-icon"
        onclick={onClose}
        data-tooltip="Cerrar ventana"
      >
        <X size={20} />
      </button>
    </div>

    <!-- Navigation Tabs -->
    <div class="settings-tabs">
      <button
        type="button"
        class="settings-tab-btn {activeTab === 'appearance' ? 'is-active' : ''}"
        onclick={() => (activeTab = 'appearance')}
      >
        <Palette size={16} />
        <span>Apariencia</span>
      </button>
      <button
        type="button"
        class="settings-tab-btn {activeTab === 'backup' ? 'is-active' : ''}"
        onclick={() => (activeTab = 'backup')}
      >
        <HardDrive size={16} />
        <span>Copias de Seguridad</span>
      </button>
      <button
        type="button"
        class="settings-tab-btn {activeTab === 'about' ? 'is-active' : ''}"
        onclick={() => (activeTab = 'about')}
      >
        <Info size={16} />
        <span>Acerca de</span>
      </button>
    </div>

    <!-- Feedback Banner -->
    {#if feedbackMessage}
      <div class="settings-alert {feedbackMessage.type}">
        {#if feedbackMessage.type === 'success'}
          <Check size={18} class="shrink-0 text-[var(--accent-success)]" />
        {:else}
          <AlertTriangle size={18} class="shrink-0 text-[var(--accent-desire)]" />
        {/if}
        <span class="font-bold text-sm">{feedbackMessage.text}</span>
      </div>
    {/if}

    <!-- Content Area -->
    <div class="settings-body">
      {#if activeTab === 'appearance'}
        <div class="settings-section">
          <h3 class="section-title">Tema Visual</h3>
          <p class="section-desc">Selecciona la paleta y contraste para tus sesiones de lectura.</p>

          <div class="theme-options-grid">
            <button
              type="button"
              class="theme-card {settings.theme === 'standard' ? 'is-selected' : ''}"
              onclick={() => handleThemeChange('standard')}
            >
              <div class="theme-preview standard">
                <span class="theme-badge-demo">Aa</span>
              </div>
              <span class="theme-name font-bold">Estándar Neobrutalista</span>
              <span class="theme-sub">Alto contraste y acentos vivos</span>
            </button>

            <button
              type="button"
              class="theme-card {settings.theme === 'calm' ? 'is-selected' : ''}"
              onclick={() => handleThemeChange('calm')}
            >
              <div class="theme-preview calm">
                <span class="theme-badge-demo">Aa</span>
              </div>
              <span class="theme-name font-bold">Modo Calma</span>
              <span class="theme-sub">Marfil suave anti-fatiga visual y dislexia</span>
            </button>

            <button
              type="button"
              class="theme-card {settings.theme === 'high-contrast' ? 'is-selected' : ''}"
              onclick={() => handleThemeChange('high-contrast')}
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
              class="font-card {settings.fontFamily === 'inter' ? 'is-selected' : ''}"
              onclick={() => handleFontChange('inter')}
            >
              <span class="font-preview" style="font-family: 'Inter', sans-serif;">Inter Aa</span>
              <span class="theme-name font-bold">Inter</span>
              <span class="theme-sub">Sans moderna, lectura neutra (por defecto)</span>
            </button>
            <button
              type="button"
              class="font-card {settings.fontFamily === 'lexend' ? 'is-selected' : ''}"
              onclick={() => handleFontChange('lexend')}
            >
              <span class="font-preview" style="font-family: 'Lexend', sans-serif;">Lexend Aa</span>
              <span class="theme-name font-bold">Lexend</span>
              <span class="theme-sub">Anti-dislexia, espaciado generoso</span>
            </button>
            <button
              type="button"
              class="font-card {settings.fontFamily === 'mono' ? 'is-selected' : ''}"
              onclick={() => handleFontChange('mono')}
            >
              <span class="font-preview" style="font-family: 'JetBrains Mono', monospace;">Mono Aa</span>
              <span class="theme-name font-bold">JetBrains Mono</span>
              <span class="theme-sub">Monoespaciada, foco técnico</span>
            </button>
            <button
              type="button"
              class="font-card {settings.fontFamily === 'syne' ? 'is-selected' : ''}"
              onclick={() => handleFontChange('syne')}
            >
              <span class="font-preview" style="font-family: 'Syne', sans-serif;">Syne Aa</span>
              <span class="theme-name font-bold">Syne</span>
              <span class="theme-sub">Display contundente, titulares</span>
            </button>
          </div>
        </div>
      {:else if activeTab === 'backup'}
        <div class="settings-section">
          <h3 class="section-title">Centro de Respaldos</h3>
          <p class="section-desc">
            Exporta o restaura tus notas personales, resaltados y versículos guardados en formato JSON.
          </p>

          <div class="backup-actions-grid">
            <!-- Export Card -->
            <div class="backup-card">
              <div class="flex items-center gap-2 mb-2">
                <Download size={20} class="text-[var(--accent-attention)]" />
                <h4 class="font-bold text-sm">Exportar Respaldo</h4>
              </div>
              <p class="text-xs text-[var(--text-muted)] mb-4">
                Descarga un archivo .json con toda tu biblioteca y apuntes locales.
              </p>
              <button
                type="button"
                class="neo-btn-primary w-full justify-center"
                onclick={handleExport}
              >
                <Download size={16} />
                <span>Descargar Backup (.json)</span>
              </button>
            </div>

            <!-- Import Card -->
            <div class="backup-card">
              <div class="flex items-center gap-2 mb-2">
                <Upload size={20} class="text-[var(--accent-interest)]" />
                <h4 class="font-bold text-sm">Restaurar Respaldo</h4>
              </div>
              <p class="text-xs text-[var(--text-muted)] mb-3">
                Carga un archivo de respaldo previo para restaurar tus notas y marcadores.
              </p>
              <!-- Modo de importación: Fusionar vs Sobrescribir -->
              <div class="import-mode-toggle">
                <button
                  type="button"
                  class="import-mode-btn {shouldMerge ? 'is-active' : ''}"
                  onclick={() => (shouldMerge = true)}
                  data-tooltip="Fusionar: conserva tus datos actuales y añade solo los nuevos del backup (sin duplicados por ID)"
                >
                  <span class="mode-dot {shouldMerge ? 'on' : ''}"></span>
                  <span>Fusionar</span>
                </button>
                <button
                  type="button"
                  class="import-mode-btn { !shouldMerge ? 'is-active danger' : ''}"
                  onclick={() => (shouldMerge = false)}
                  data-tooltip="Sobrescribir: borra tus datos actuales y los reemplaza por los del backup"
                >
                  <span class="mode-dot {!shouldMerge ? 'on danger' : ''}"></span>
                  <span>Sobrescribir</span>
                </button>
              </div>
              <p class="text-xs font-medium mb-3" style="color: {shouldMerge ? 'var(--text-muted)' : 'var(--accent-desire)'}">
                {#if shouldMerge}
                  ↻ Se conservarán tus datos + se añadirán los del backup (recomendado)
                {:else}
                  ⚠ Se borrarán tus datos actuales y se reemplazarán
                {/if}
              </p>
              <input
                type="file"
                accept=".json"
                class="hidden"
                bind:this={fileInputRef}
                onchange={handleFileSelect}
              />
              <button
                type="button"
                class="neo-btn-secondary w-full justify-center"
                onclick={() => fileInputRef?.click()}
              >
                <Upload size={16} />
                <span>Seleccionar archivo (.json)</span>
              </button>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="danger-zone-card mt-6">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h4 class="font-bold text-sm text-[var(--accent-desire)]">Zona de Peligro</h4>
                <p class="text-xs text-[var(--text-muted)]">
                  Borra todos los marcadores, notas y resaltados guardados en este navegador.
                </p>
              </div>
              {#if !showResetConfirm}
                <button
                  type="button"
                  class="neo-btn-danger"
                  onclick={() => (showResetConfirm = true)}
                >
                  <Trash2 size={15} />
                  <span>Borrar datos</span>
                </button>
              {:else}
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="neo-btn-danger confirm"
                    onclick={handleReset}
                  >
                    Confirmar borrado
                  </button>
                  <button
                    type="button"
                    class="neo-btn-secondary text-xs"
                    onclick={() => (showResetConfirm = false)}
                  >
                    Cancelar
                  </button>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <div class="settings-section">
          <div class="about-brand-card">
            <div class="flex items-center gap-3 mb-3">
              <span class="about-logo">A</span>
              <div>
                <h3 class="text-lg font-bold">Alethia<span class="text-[var(--accent-interest)]">Gateway</span></h3>
                <span class="text-xs font-mono font-bold">Versión 1.0.0 (Fase 1)</span>
              </div>
            </div>
            <p class="text-xs text-[var(--text-muted)] leading-relaxed">
              Plataforma web neobrutalista, ultrarrápida y accesible para la lectura bíblica comparativa, concordancia exhaustiva, referencias cruzadas (TSK) y devocionales diarios.
            </p>
          </div>

          <div class="modules-overview-grid mt-4">
            <div class="module-stat-pill">
              <span class="font-bold">22 Traducciones</span>
              <span class="text-xs text-[var(--text-muted)]">Español, Inglés, Griego, Hebreo, Latín</span>
            </div>
            <div class="module-stat-pill">
              <span class="font-bold">306,800+ Referencias TSK</span>
              <span class="text-xs text-[var(--text-muted)]">Treasury of Scripture Knowledge</span>
            </div>
            <div class="module-stat-pill">
              <span class="font-bold">366 Devocionales Diarios</span>
              <span class="text-xs text-[var(--text-muted)]">C.H. Spurgeon Morning & Evening</span>
            </div>
            <div class="module-stat-pill">
              <span class="font-bold">Motor de Concordancia</span>
              <span class="text-xs text-[var(--text-muted)]">Búsqueda temática con latencia &lt;5ms</span>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="settings-footer">
      <button
        type="button"
        class="neo-btn-primary"
        onclick={onClose}
      >
        <span>Listo</span>
      </button>
    </div>
  </div>
{/if}

<style>
  .settings-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 140;
    backdrop-filter: blur(2px);
    border: none;
    cursor: pointer;
  }

  .settings-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 92%;
    max-width: 600px;
    max-height: 88vh;
    background-color: var(--bg-surface);
    border: var(--border-width-desktop) solid var(--border-color);
    box-shadow: 8px 8px 0 var(--border-color);
    z-index: 150;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: modalPop 0.15s ease-out;
  }

  @keyframes modalPop {
    from {
      opacity: 0;
      transform: translate(-50%, -48%) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  .settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background-color: var(--accent-attention);
    border-bottom: 2px solid var(--border-color);
  }

  .settings-icon-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background-color: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
  }

  .settings-title {
    font-family: var(--font-display);
    font-size: 1.125rem;
    font-weight: 800;
    color: var(--text-main);
    line-height: 1.1;
  }

  .settings-subtitle {
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .settings-tabs {
    display: flex;
    background-color: var(--bg-canvas);
    border-bottom: 2px solid var(--border-color);
  }

  .settings-tab-btn {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 14px;
    font-family: var(--font-display);
    font-size: 0.8125rem;
    font-weight: 700;
    border: none;
    border-right: 1px solid var(--border-color);
    background: transparent;
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .settings-tab-btn span {
    min-width: 0;
    text-align: center;
    overflow-wrap: anywhere;
  }

  .settings-tab-btn:last-child {
    border-right: none;
  }

  .settings-tab-btn.is-active {
    background-color: var(--bg-surface);
    border-bottom: 3px solid var(--accent-desire);
  }

  .settings-alert {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-bottom: 2px solid var(--border-color);
  }

  .settings-alert.success {
    background-color: #e8f8f0;
  }

  .settings-alert.error {
    background-color: #fee2e2;
  }

  .settings-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 800;
    margin-bottom: 4px;
  }

  .section-desc {
    font-size: 0.8125rem;
    color: var(--text-muted);
    margin-bottom: 16px;
  }

  .theme-options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .theme-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
    background-color: var(--bg-canvas);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
    text-align: left;
    transition: all 0.1s ease;
  }

  .theme-card:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--border-color);
  }

  .theme-card.is-selected {
    border-color: var(--border-color);
    background-color: var(--bg-surface);
    box-shadow: 4px 4px 0 var(--accent-attention);
  }

  .theme-preview {
    width: 100%;
    height: 48px;
    border: 1.5px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
  }

  .theme-preview.standard {
    background-color: #f5f5f0;
  }

  .theme-preview.calm {
    background-color: #f7f4ed;
  }

  .theme-preview.high-contrast {
    background-color: #000;
    color: #fff;
    border-color: #000;
  }

  .theme-preview.high-contrast .theme-badge-demo {
    color: #fff;
  }

  .font-options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
  }

  .font-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
    background-color: var(--bg-canvas);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
    text-align: left;
    transition: all 0.1s ease;
  }

  .font-card:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--border-color);
  }

  .font-card.is-selected {
    border-color: var(--border-color);
    background-color: var(--bg-surface);
    box-shadow: 4px 4px 0 var(--accent-interest);
  }

  .font-preview {
    width: 100%;
    font-size: 1.1rem;
    font-weight: 800;
    border: 1.5px solid var(--border-color);
    background: var(--bg-surface);
    padding: 10px;
    margin-bottom: 8px;
    text-align: center;
  }

  .theme-badge-demo {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.25rem;
  }

  .theme-name {
    font-size: 0.875rem;
    color: var(--text-main);
  }

  .theme-sub {
    font-size: 0.6875rem;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .backup-actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
  }

  .backup-card {
    background-color: var(--bg-canvas);
    border: 2px solid var(--border-color);
    padding: 14px;
    box-shadow: 2px 2px 0 var(--border-color);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .import-mode-toggle {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-bottom: 8px;
  }

  .import-mode-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 8px;
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 800;
    background-color: var(--bg-surface);
    border: 1.5px solid var(--border-color);
    box-shadow: 1.5px 1.5px 0 var(--border-color);
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .import-mode-btn.is-active {
    background-color: var(--accent-interest);
    box-shadow: 2px 2px 0 var(--border-color);
    transform: translate(-1px, -1px);
  }

  .import-mode-btn.is-active.danger {
    background-color: #fee2e2;
    border-color: var(--accent-desire);
    color: var(--accent-desire);
  }

  .mode-dot {
    width: 10px;
    height: 10px;
    border: 1.5px solid var(--border-color);
    background: var(--bg-surface);
    flex-shrink: 0;
  }

  .mode-dot.on {
    background: var(--accent-success);
    border-color: var(--border-color);
    box-shadow: inset 0 0 0 2px var(--bg-surface);
  }

  .mode-dot.on.danger {
    background: var(--accent-desire);
  }

  .danger-zone-card {
    background-color: #fef2f2;
    border: 2px dashed var(--accent-desire);
    padding: 14px;
  }

  .about-brand-card {
    background-color: var(--bg-canvas);
    border: 2px solid var(--border-color);
    padding: 16px;
    box-shadow: 2px 2px 0 var(--border-color);
  }

  .about-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background-color: var(--accent-attention);
    border: 2px solid var(--border-color);
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 900;
    box-shadow: 2px 2px 0 var(--border-color);
  }

  .modules-overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
  }

  .module-stat-pill {
    background-color: var(--bg-surface);
    border: 1.5px solid var(--border-color);
    padding: 10px;
    display: flex;
    flex-direction: column;
    box-shadow: 2px 2px 0 var(--border-color);
  }

  .settings-footer {
    display: flex;
    justify-content: flex-end;
    padding: 12px 18px;
    background-color: var(--bg-canvas);
    border-top: 2px solid var(--border-color);
  }

  .neo-btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background-color: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
  }

  .neo-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    font-family: var(--font-display);
    font-size: 0.8125rem;
    font-weight: 800;
    background-color: var(--accent-attention);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
  }

  .neo-btn-primary:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--border-color);
  }

  .neo-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    font-family: var(--font-display);
    font-size: 0.8125rem;
    font-weight: 800;
    background-color: var(--bg-surface);
    border: 2px solid var(--border-color);
    box-shadow: 2px 2px 0 var(--border-color);
    cursor: pointer;
  }

  .neo-btn-danger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 800;
    background-color: #fee2e2;
    color: var(--accent-desire);
    border: 1.5px solid var(--accent-desire);
    cursor: pointer;
  }

  .neo-btn-danger.confirm {
    background-color: var(--accent-desire);
    color: #fff;
  }

  @media (max-width: 480px) {
    .settings-tab-btn {
      gap: 4px;
      padding: 10px 6px;
      font-size: 0.75rem;
    }
  }
</style>
