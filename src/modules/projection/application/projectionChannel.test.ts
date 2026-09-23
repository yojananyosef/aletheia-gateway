import { describe, expect, it } from 'vitest';
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
