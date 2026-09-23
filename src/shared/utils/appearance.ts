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
  opendyslexic: "'OpenDyslexic', 'Lexend', 'Verdana', sans-serif",
};

const THEME_CLASSES = ['mode-calm', 'mode-high-contrast', 'mode-sepia', 'mode-oled', 'mode-dark'];

export function applyThemeClass(mode: string): void {
  if (typeof document === 'undefined') return;
  document.body.classList.remove(...THEME_CLASSES);
  if (mode === 'calm') document.body.classList.add('mode-calm');
  else if (mode === 'high-contrast') document.body.classList.add('mode-high-contrast');
  else if (mode === 'sepia') document.body.classList.add('mode-sepia');
  else if (mode === 'oled') document.body.classList.add('mode-oled');
  else if (mode === 'dark') document.body.classList.add('mode-dark');
}

export function applyFontClass(font: string): void {
  if (typeof document === 'undefined') return;
  document.body.classList.remove('font-inter', 'font-lexend', 'font-mono', 'font-syne', 'font-opendyslexic');
  document.body.classList.add(`font-${font}`);
  const stack = FONT_BODY_MAP[font];
  if (stack) {
    document.documentElement.style.setProperty('--font-body', stack);
  }
}

/** Activa/desactiva ayudas de lectura (bionic, ruler, red-letters). No-op en SSR. */
export function applyReadingClass(opts: { bionic?: string; ruler?: boolean; redLetters?: boolean }): void {
  if (typeof document === 'undefined') return;
  document.body.classList.remove('bionic-leve', 'bionic-fuerte');
  if (opts.bionic === 'leve') document.body.classList.add('bionic-leve');
  else if (opts.bionic === 'fuerte') document.body.classList.add('bionic-fuerte');
  document.body.classList.toggle('ruler-on', opts.ruler === true);
  document.body.classList.toggle('red-letters-on', opts.redLetters === true);
}

/** Persiste el flag legacy de modo calma (clave `aletheia_calm_mode`). */
export function persistCalmMode(isCalm: boolean): void {
  try {
    localStorage.setItem('aletheia_calm_mode', String(isCalm));
  } catch {
    // Almacenamiento no disponible: se ignora.
  }
}
