/**
 * Apariencia global (tema base + overlay de calma + tipografía).
 *
 * Modelo:
 * - Tema base: 'standard' (sin clase) | 'high-contrast' | 'sepia' | 'oled' | 'dark'.
 * - 'calm' es LEGACY: equivale a base 'standard' + overlay `calm-on`.
 * - Modo calma actual: overlay global `body.calm-on`, combinable con
 *   cualquier tema base (tenue + dislexia sin romper AAA).
 * Las funciones son no-op fuera del navegador (SSR / tests).
 */

export const FONT_BODY_MAP: Record<string, string> = {
  inter: "'Inter', 'DM Sans', system-ui, sans-serif",
  lexend: "'Lexend', 'Verdana', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
  syne: "'Syne', 'Archivo Black', sans-serif",
  opendyslexic: "'OpenDyslexic', 'Lexend', 'Verdana', sans-serif",
};

const BASE_THEME_CLASSES = ['mode-high-contrast', 'mode-sepia', 'mode-oled', 'mode-dark'];
const CALM_OVERLAY_CLASS = 'calm-on';
const LEGACY_CALM_CLASS = 'mode-calm';

function baseClassFor(mode: string): string | null {
  if (mode === 'high-contrast') return 'mode-high-contrast';
  if (mode === 'sepia') return 'mode-sepia';
  if (mode === 'oled') return 'mode-oled';
  if (mode === 'dark') return 'mode-dark';
  return null;
}

/** Overlay de calma (tenue global). No-op en SSR. */
export function applyCalmOverlay(on: boolean): void {
  if (typeof document === 'undefined') return;
  document.body.classList.remove(LEGACY_CALM_CLASS);
  document.body.classList.toggle(CALM_OVERLAY_CLASS, on === true);
}

/** Indica si el overlay de calma esta activo (false en SSR). */
export function isCalmOverlayActive(): boolean {
  if (typeof document === 'undefined') return false;
  return document.body.classList.contains(CALM_OVERLAY_CLASS);
}

/**
 * Aplica el tema base. `mode === 'calm'` se interpreta como legacy
 * (standard + overlay). `opts.calm` fuerza el estado del overlay;
 * si se omite, se conserva el estado actual del overlay.
 */
export function applyThemeClass(mode: string, opts?: { calm?: boolean }): void {
  if (typeof document === 'undefined') return;
  const legacyCalm = mode === 'calm';
  const base = legacyCalm ? 'standard' : mode;
  document.body.classList.remove(...BASE_THEME_CLASSES, LEGACY_CALM_CLASS);
  const cls = baseClassFor(base);
  if (cls) document.body.classList.add(cls);
  const calmOpt = opts?.calm;
  if (calmOpt === true || (calmOpt === undefined && legacyCalm)) {
    document.body.classList.add(CALM_OVERLAY_CLASS);
  } else if (calmOpt === false) {
    document.body.classList.remove(CALM_OVERLAY_CLASS);
  }
  // Si opts.calm es undefined y no es legacy, se conserva el overlay actual.
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

/** Persiste el flag de calma (clave `aletheia_calm_mode`). */
export function persistCalmMode(isCalm: boolean): void {
  try {
    localStorage.setItem('aletheia_calm_mode', String(isCalm));
  } catch {
    // Almacenamiento no disponible: se ignora.
  }
}
