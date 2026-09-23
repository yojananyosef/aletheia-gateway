/**
 * Lectura biónica: resalta la primera mitad de cada palabra con `<b class="bionic-b">`.
 * El efecto visual lo activan `body.bionic-leve / body.bionic-fuerte` (tokens.css),
 * así que el markup puede renderizarse siempre sin costo condicional.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function bionicHtml(plain: string): string {
  return plain
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part) || part.length < 4) return escapeHtml(part);
      const cut = Math.ceil(part.length / 2);
      return `<b class="bionic-b">${escapeHtml(part.slice(0, cut))}</b>${escapeHtml(part.slice(cut))}`;
    })
    .join('');
}
