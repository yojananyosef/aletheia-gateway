<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Settings2,
    X,
    Check,
    TriangleAlert,
    HardDrive,
    Info,
    Palette,
  } from 'lucide-svelte';
  import AppearanceTab from './SettingsAppearanceTab.svelte';
  import BackupTab from './SettingsBackupTab.svelte';
  import AboutTab from './SettingsAboutTab.svelte';
  import { LocalStorageSettingsRepository } from '../infrastructure/LocalStorageSettingsRepository';
  import { buildBackupFilename, downloadJsonFile, readFileAsText } from '../application/BackupFileService';
  import { applyFontClass, applyThemeClass, persistCalmMode } from '../../../shared/utils/appearance';
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

  function applyAppearanceFromSettings(s: UserSettings) {
    applyThemeClass(s.theme);
    persistCalmMode(s.theme === 'calm');
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
    persistCalmMode(calmFlag);
  }

  function handleFontChange(font: AppFontFamily) {
    settings.fontFamily = font;
    repo.saveSettings({ fontFamily: font });
    applyFontClass(font);
  }

  async function handleExport() {
    try {
      const jsonStr = await repo.exportBackup();
      downloadJsonFile(buildBackupFilename(), jsonStr);

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

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileAsText(file);
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
    } catch {
      feedbackMessage = {
        type: 'error',
        text: 'No se pudo leer el archivo seleccionado.',
      };
    }
    setTimeout(() => (feedbackMessage = null), 5000);
    if (target) target.value = '';
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
          <TriangleAlert size={18} class="shrink-0 text-[var(--accent-desire)]" />
        {/if}
        <span class="font-bold text-sm">{feedbackMessage.text}</span>
      </div>
    {/if}

    <!-- Content Area -->
    <div class="settings-body">
      {#if activeTab === 'appearance'}
        <AppearanceTab
          theme={settings.theme}
          fontFamily={settings.fontFamily}
          onThemeChange={handleThemeChange}
          onFontChange={handleFontChange}
        />
      {:else if activeTab === 'backup'}
        <BackupTab
          shouldMerge={shouldMerge}
          showResetConfirm={showResetConfirm}
          onMergeModeChange={(v) => (shouldMerge = v)}
          onExport={handleExport}
          onFileSelect={handleFileSelect}
          onRequestReset={() => (showResetConfirm = true)}
          onCancelReset={() => (showResetConfirm = false)}
          onConfirmReset={handleReset}
        />
      {:else}
        <AboutTab />
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
