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
  type: 'verse' | 'clear' | 'ready';
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

/**
 * Último mensaje enviado, para poder reenviarlo cuando el receptor avise que ya
 * está suscrito. Un `BroadcastChannel` no tiene acuse de recibo: lo que se envía
 * antes de que el otro extremo se suscriba se descarta en silencio.
 */
let pending: ProjectionMessage | null = null;

/**
 * Reintentos con reloj todavía vivos. Sin esto, pulsar «Detener» no surte efecto:
 * el temporizador de 2,5 s dispara después y vuelve a proyectar el pasaje que el
 * usuario acababa de apagar.
 */
let reintentos: ReturnType<typeof setTimeout>[] = [];

function cancelarReintentos() {
  for (const id of reintentos) clearTimeout(id);
  reintentos = [];
}

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!channel) {
    try {
      channel = new BroadcastChannel(PROJECTION_CHANNEL);
    } catch {
      return null;
    }
    // El visor anuncia `ready` al suscribirse y cada anuncio reenvía lo pendiente.
    channel.addEventListener('message', (event: MessageEvent<ProjectionMessage>) => {
      if (event.data?.type === 'ready' && pending) sendProjection(pending);
    });
  }
  return channel;
}

export function sendProjection(message: ProjectionMessage): boolean {
  const ch = getChannel();
  if (!ch) return false;
  // `ready` es del receptor: no debe quedar registrado como pendiente ni
  // provocar un eco al recibirlo.
  if (message.type !== 'ready') pending = message;
  try {
    ch.postMessage(message);
    return true;
  } catch {
    return false;
  }
}

export function clearProjection(): boolean {
  cancelarReintentos();
  const ok = sendProjection({ type: 'clear' });
  // Nada pendiente: si el visor vuelve a anunciarse no debe reenviar nada.
  pending = null;
  return ok;
}

export function openProjectionWindow(): boolean {
  return openProjectionWindowRef() !== null;
}

function openProjectionWindowRef(): Window | null {
  if (typeof window === 'undefined') return null;
  try {
    const width = 1280;
    const height = 720;
    const left = window.screen.width - width;
    const top = 0;
    const win = window.open(
      PROJECTION_URL,
      'BibleProjection',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes,popup=yes`,
    );
    if (win) {
      try {
        win.focus();
      } catch {
        // ignorar (bloqueo de foco)
      }
      return win;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Abre (o enfoca) la ventana visora ANTES de enviar, y reintenta el envío
 * porque el receptor se suscribe al `BroadcastChannel` al cargar.
 * Sin esto el primer mensaje se pierde (ventana aún cargando) y parece
 * que "el proyector no funciona". Modelo auditado: Proyektor/labiblia.in
 * (`window.open(visor)` + `cambiartexto()` diferido + iframe de vista previa).
 *
 * Los reintentos con reloj son sólo la red de seguridad: la vía fiable es el
 * handshake `ready`, que no depende de cuánto tarde el visor. Con un arranque
 * en frío de Vercel o una red móvil el visor puede tardar más de dos segundos en
 * suscribirse, y para entonces cualquier temporizador fijo ya se agotó.
 */
export function projectPassage(message: ProjectionMessage, retries = [150, 500, 1200, 2500, 4000]): boolean {
  if (typeof window === 'undefined') return false;
  cancelarReintentos();
  const win = openProjectionWindowRef();
  // Enviar aunque el popup fuese bloqueado: si el usuario ya tiene
  // /projection abierto a mano, el BroadcastChannel igual llega.
  // `sendProjection` deja el mensaje como pendiente, así que cada `ready` del
  // visor lo reenvía aunque haya llegado después del último temporizador.
  let sent = sendProjection(message);
  reintentos = retries.map((delay) =>
    setTimeout(() => {
      try {
        sendProjection(message);
      } catch {
        // ignorar
      }
    }, delay),
  );
  // Si ni popup ni canal: fallo real (navegador sin BroadcastChannel).
  if (!win && !sent) return false;
  return true;
}
