<script lang="ts">
  import { Download, Upload, Trash2 } from 'lucide-svelte';

  interface Props {
    shouldMerge: boolean;
    showResetConfirm: boolean;
    onMergeModeChange: (merge: boolean) => void;
    onExport: () => void;
    onFileSelect: (event: Event) => void;
    onRequestReset: () => void;
    onCancelReset: () => void;
    onConfirmReset: () => void;
  }

  let {
    shouldMerge,
    showResetConfirm,
    onMergeModeChange,
    onExport,
    onFileSelect,
    onRequestReset,
    onCancelReset,
    onConfirmReset,
  }: Props = $props();

  let fileInputRef: HTMLInputElement | undefined = $state();
</script>

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
        onclick={onExport}
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
          onclick={() => (onMergeModeChange(true))}
          data-tooltip="Fusionar: conserva tus datos actuales y añade solo los nuevos del backup (sin duplicados por ID)"
        >
          <span class="mode-dot {shouldMerge ? 'on' : ''}"></span>
          <span>Fusionar</span>
        </button>
        <button
          type="button"
          class="import-mode-btn { !shouldMerge ? 'is-active danger' : ''}"
          onclick={() => (onMergeModeChange(false))}
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
        onchange={onFileSelect}
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
          onclick={() => (onRequestReset())}
        >
          <Trash2 size={15} />
          <span>Borrar datos</span>
        </button>
      {:else}
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="neo-btn-danger confirm"
            onclick={onConfirmReset}
          >
            Confirmar borrado
          </button>
          <button
            type="button"
            class="neo-btn-secondary text-xs"
            onclick={() => (onCancelReset())}
          >
            Cancelar
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
