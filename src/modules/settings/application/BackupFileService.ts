/**
 * Capa de aplicación: orquestación de archivos de respaldo.
 * El modal solo llama a estas funciones; el parseo/merge vive
 * en LocalStorageSettingsRepository (infraestructura).
 */

export function buildBackupFilename(prefix = 'aletheia-backup', date = new Date()): string {
  const day = date.toISOString().split('T')[0];
  return `${prefix}-${day}.json`;
}

export function downloadJsonFile(filename: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
