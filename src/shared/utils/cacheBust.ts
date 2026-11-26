/**
 * Une una ruta absoluta con la base del sitio.
 *
 * En GitHub Pages la app vive en `/aletheia-gateway/`, así que `/data/...`
 * debe resolverse como `/aletheia-gateway/data/...`. En un dominio propio la
 * base es `/` y la ruta queda igual.
 */
export function withBase(path: string): string {
  if (!path.startsWith('/')) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (path === '/') return base || '/';
  return `${base}${path}`;
}

export function cacheBust(url: string): string {
  const based = withBase(url);
  return `${based}${based.includes('?') ? '&' : '?'}v=${__BUILD_ID__}`;
}
