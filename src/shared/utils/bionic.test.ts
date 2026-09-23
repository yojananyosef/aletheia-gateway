import { describe, expect, it } from 'vitest';
import { bionicHtml } from './bionic';

describe('bionicHtml', () => {
  it('resalta la primera mitad de palabras largas', () => {
    expect(bionicHtml('En principio')).toBe('En <b class="bionic-b">princ</b>ipio');
  });

  it('deja intactas palabras cortas y espacios', () => {
    expect(bionicHtml('y la luz')).toBe('y la luz');
    expect(bionicHtml('y la casa')).toBe('y la <b class="bionic-b">ca</b>sa');
  });

  it('escapa HTML antes de envolver', () => {
    expect(bionicHtml('a<b>cielo')).toBe('<b class="bionic-b">a&lt;b&gt;c</b>ielo');
  });

  it('cadena vacía no rompe', () => {
    expect(bionicHtml('')).toBe('');
  });
});
