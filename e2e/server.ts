/**
 * Servidor estático en foreground para e2e (Astro 7 demoniza `dev`/`preview`,
 * lo que rompe el webServer de Playwright). Sirve `dist/` con fallback SPA.
 */
/// <reference types="bun-types" />
import path from 'node:path';

const dist = path.resolve(import.meta.dir, '../dist');
const port = Number(process.env.E2E_PORT ?? 4322);

const server = Bun.serve({
  port,
  async fetch(req: Request) {
    const pathname = decodeURIComponent(new URL(req.url).pathname);
    const candidate = path.join(dist, pathname === '/' ? 'index.html' : pathname.slice(1));
    const file = Bun.file(candidate);
    if (await file.exists()) return new Response(file);
    return new Response(Bun.file(path.join(dist, 'index.html')));
  },
});

// eslint-disable-next-line no-console
console.log(`e2e static server at http://localhost:${server.port}`);

export default server;
