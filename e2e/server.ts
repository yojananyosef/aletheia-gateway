/**
 * Servidor estático en foreground para e2e (Astro 7 demoniza `dev`/`preview`,
 * lo que rompe el webServer de Playwright). Sirve `dist/` con fallback SPA.
 */
/// <reference types="bun-types" />
import path from 'node:path';

const dist = path.resolve(import.meta.dir, '../dist');
const port = Number(process.env.E2E_PORT ?? 4322);

// `BunFile` no es un tipo global para `astro check`, que no carga bun-types
// para el directorio e2e.
type ArchivoEstatico = ReturnType<typeof Bun.file>;

async function resolve(pathname: string): Promise<ArchivoEstatico | null> {
  const rel = pathname === '/' ? 'index.html' : pathname.slice(1);
  const file = Bun.file(path.join(dist, rel));
  if (await file.exists()) return file;
  // Rutas de directorio: Astro emite dist/projection/index.html, y un servidor
  // estático real sirve /projection desde ahí. Sin esto el visor de proyección
  // caía al shell del SPA y e2e no podía cubrirlo.
  const index = Bun.file(path.join(dist, rel, 'index.html'));
  return (await index.exists()) ? index : null;
}

const server = Bun.serve({
  port,
  async fetch(req: Request) {
    const pathname = decodeURIComponent(new URL(req.url).pathname);
    const file = await resolve(pathname);
    if (file) return new Response(file);
    return new Response(Bun.file(path.join(dist, 'index.html')));
  },
});

// eslint-disable-next-line no-console
console.log(`e2e static server at http://localhost:${server.port}`);

export default server;
