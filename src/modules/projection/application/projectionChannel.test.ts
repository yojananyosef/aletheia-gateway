import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildProjectionText, buildVerseMessage, PROJECTION_CHANNEL, PROJECTION_URL } from './projectionChannel';

describe('projectionChannel', () => {
  it('expone canal y URL estables (compatibles con el receptor)', () => {
    expect(PROJECTION_CHANNEL).toBe('bible-projection-channel');
    expect(PROJECTION_URL).toBe('/projection');
  });

  it('construye HTML con sup y escapado', () => {
    const html = buildProjectionText([
      { number: 1, text: 'En el principio <b>Dios</b>' },
      { number: 2, text: '  ' },
      { number: 3, text: 'Y la tierra' },
    ]);
    expect(html).toBe('<sup>1</sup> En el principio &lt;b&gt;Dios&lt;/b&gt; <sup>3</sup> Y la tierra');
  });

  it('arma el mensaje de versículo', () => {
    const msg = buildVerseMessage(
      { book: 'Génesis', chapter: 1 },
      [{ number: 1, text: 'En el principio' }],
      'Génesis 1:1',
      'RV1909',
    );
    expect(msg.type).toBe('verse');
    expect(msg.reference).toBe('Génesis 1:1');
    expect(msg.text).toContain('<sup>1</sup>');
  });
});

/**
 * El canal no tiene acuse de recibo: lo que se envía antes de que el visor se
 * suscriba se descarta en silencio. Estos tests fijan el handshake `ready` y la
 * cancelación de reintentos, que son lo que hacía fallar la proyección.
 */
describe('projectionChannel: handshake y cancelación', () => {
  /** Canal falso con la semántica real: entrega a los demás, nunca a sí mismo. */
  class FakeChannel {
    static byName = new Map<string, FakeChannel[]>();
    onmessage: ((e: { data: unknown }) => void) | null = null;
    private listeners: ((e: { data: unknown }) => void)[] = [];

    constructor(readonly name: string) {
      FakeChannel.byName.set(name, [...(FakeChannel.byName.get(name) ?? []), this]);
    }

    addEventListener(_type: string, fn: (e: { data: unknown }) => void) {
      this.listeners.push(fn);
    }

    postMessage(data: unknown) {
      enviados.push(data as { type: string });
      for (const otro of FakeChannel.byName.get(this.name) ?? []) {
        if (otro === this) continue;
        queueMicrotask(() => {
          const event = { data };
          otro.onmessage?.(event);
          for (const fn of otro.listeners) fn(event);
        });
      }
    }

    close() {
      FakeChannel.byName.set(
        this.name,
        (FakeChannel.byName.get(this.name) ?? []).filter((c) => c !== this),
      );
    }
  }

  let enviados: { type: string }[] = [];
  let modulo: typeof import('./projectionChannel');

  const versiculo = () =>
    modulo.buildVerseMessage({ book: 'Génesis', chapter: 1 }, [{ number: 1, text: 'En el principio' }], 'Génesis 1');

  const versos = () => enviados.filter((m) => m.type === 'verse').length;

  /** Lo que emitió el lector: el `ready` del visor es control suyo, no salida. */
  const emitidos = () => enviados.filter((m) => m.type !== 'ready').length;

  beforeEach(async () => {
    vi.useFakeTimers();
    FakeChannel.byName.clear();
    enviados = [];
    (globalThis as Record<string, unknown>).window = {
      open: () => ({ focus() {} }),
      screen: { width: 1920 },
    };
    (globalThis as Record<string, unknown>).BroadcastChannel = FakeChannel;
    // El canal y el mensaje pendiente son estado a nivel de módulo.
    vi.resetModules();
    modulo = await import('./projectionChannel');
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).BroadcastChannel;
  });

  it('reenvía el pasaje cuando el visor se anuncia con `ready`', async () => {
    modulo.sendProjection(versiculo());
    const antes = emitidos();

    const visor = new FakeChannel(PROJECTION_CHANNEL);
    visor.postMessage({ type: 'ready' });
    await vi.runAllTicks();

    expect(emitidos()).toBe(antes + 1);
    expect(enviados.at(-1)!.type).toBe('verse');
  });

  it('reenvía en cada anuncio `ready`, no sólo en el primero', async () => {
    modulo.sendProjection(versiculo());
    const antes = versos();

    for (let i = 0; i < 3; i++) {
      const visor = new FakeChannel(PROJECTION_CHANNEL);
      visor.postMessage({ type: 'ready' });
      await vi.runAllTicks();
      visor.close();
    }

    expect(versos()).toBe(antes + 3);
  });

  it('programa los reintentos del reloj al proyectar', () => {
    modulo.projectPassage(versiculo(), [150, 500, 1200]);
    expect(versos()).toBe(1);

    vi.advanceTimersByTime(2000);

    expect(versos()).toBe(4);
  });

  it('apagar cancela los reintentos: nada revive la proyección', () => {
    modulo.projectPassage(versiculo(), [150, 500, 1200]);
    modulo.clearProjection();
    const antes = enviados.length;

    vi.advanceTimersByTime(10_000);

    expect(enviados.length).toBe(antes);
    expect(enviados.at(-1)!.type).toBe('clear');
  });

  it('tras apagar no queda pasaje pendiente que reenviar', async () => {
    modulo.sendProjection(versiculo());
    modulo.clearProjection();
    const antes = emitidos();

    const visor = new FakeChannel(PROJECTION_CHANNEL);
    visor.postMessage({ type: 'ready' });
    await vi.runAllTicks();

    expect(emitidos()).toBe(antes);
  });
});
