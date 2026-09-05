/**
 * Migración perezosa de claves de localStorage.
 *
 * En v0.11 el nombre del proyecto se corrigió de "Alethia" a "Aletheia"
 * y las claves `alethia_*` pasaron a `aletheia_*`. Para no borrar los
 * datos guardados por usuarios existentes (marcadores, resaltados,
 * notas, ajustes), la primera lectura cae al nombre legacy y lo
 * promueve a la clave nueva. Las claves legacy pueden eliminarse
 * en una versión major futura.
 */
export function readStorageWithLegacy(key: string, legacyKey: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const current = localStorage.getItem(key);
    if (current !== null) return current;
    const legacy = localStorage.getItem(legacyKey);
    if (legacy === null) return null;
    try {
      localStorage.setItem(key, legacy);
      localStorage.removeItem(legacyKey);
    } catch {
      // Almacenamiento lleno o bloqueado: se devuelve el valor legacy sin migrar.
    }
    return legacy;
  } catch {
    return null;
  }
}

export function removeStorageWithLegacy(key: string, legacyKey: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(key);
    localStorage.removeItem(legacyKey);
  } catch {
    // Sin almacenamiento: nada que limpiar.
  }
}
