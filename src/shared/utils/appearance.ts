/**
 * Apariencia global (tema + tipografía).
 * Extraído de AppShell y SettingsModal, que duplicaban este código.
 * Las funciones son no-op fuera del navegador (SSR / tests).
 */

export const FONT_BODY_MAP: Record<string, string> = {
  inter: "'Inter', 'DM Sans', system-ui, sans-serif",
  lexend: "'Lexend', 'Verdana', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
  syne: "'Syne', 'Archivo Black', sans-serif",
};

export function applyThemeClass(mode: string): void {
  if (typeof document === 'undefined') return;
  document.body.classList.remove('mode-calm', 'mode-high-contrast');
  if (mode === 'calm') document.body.classList.add('mode-calm');
  else if (mode === 'high-contrast') document.body.classList.add('mode-high-contrast');
}

export function applyFontClass(font: string): void {
  if (typeof document === 'undefined') return;
  document.body.classList.remove('font-inter', 'font-lexend', 'font-mono', 'font-syne');
  document.body.classList.add(`font-${font}`);
  const stack = FONT_BODY_MAP[font];
  if (stack) {
    document.documentElement.style.setProperty('--font-body', stack);
  }
}

/** Persiste el flag legacy de modo calma (clave `aletheia_calm_mode`). */
export function persistCalmMode(isCalm: boolean): void {
  try {
    localStorage.setItem('aletheia_calm_mode', String(isCalm));
  } catch {
    // Almacenamiento no disponible: se ignora.
  }
}
