/**
 * Proyección en segunda pantalla (port del concepto NRVA `useProjection`).
 * Canal `BroadcastChannel` + ventana `/projection`. Sin dependencias UI.
 */

export const PROJECTION_CHANNEL = 'bible-projection-channel';
export const PROJECTION_URL = '/projection';

export interface ProjectionPassage {
  book: string;
  chapter: number;
}

export interface ProjectionMessage {
  type: 'verse' | 'clear';
  passage?: ProjectionPassage;
  /** HTML ya escapado (`<sup>n</sup> texto …`). */
  text?: string;
  reference?: string;
  version?: string;
}

export interface ProjectableVerse {
  number: number;
  text: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Construye el HTML proyectable de una lista de versículos (omite vacíos). */
export function buildProjectionText(verses: ProjectableVerse[]): string {
  return verses
    .filter((v) => v.text.trim().length > 0)
    .map((v) => `<sup>${v.number}</sup> ${escapeHtml(v.text.trim())}`)
    .join(' ');
}

export function buildVerseMessage(
  passage: ProjectionPassage,
  verses: ProjectableVerse[],
  reference: string,
  version?: string,
): ProjectionMessage {
  return { type: 'verse', passage, text: buildProjectionText(verses), reference, version };
}

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!channel) {
    try {
      channel = new BroadcastChannel(PROJECTION_CHANNEL);
    } catch {
      return null;
    }
  }
  return channel;
}

export function sendProjection(message: ProjectionMessage): boolean {
  const ch = getChannel();
  if (!ch) return false;
  try {
    ch.postMessage(message);
    return true;
  } catch {
    return false;
  }
}

export function clearProjection(): boolean {
  return sendProjection({ type: 'clear' });
}

export function openProjectionWindow(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const width = 1024;
    const height = 768;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const win = window.open(
      PROJECTION_URL,
      'BibleProjection',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes,popup=yes`,
    );
    if (win) {
      win.focus();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
