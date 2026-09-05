import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

// Determinista en CI/Vercel (commit SHA), fallback local con timestamp.
// Evita invalidar la caché de /_astro en cada build local idéntico.
// https://vercel.com/docs/environment-variables/system-environment-variables
const BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? process.env.GITHUB_SHA?.slice(0, 12) ?? Date.now().toString(36);

export default defineConfig({
  integrations: [svelte()],
  vite: {
    define: {
      __BUILD_ID__: JSON.stringify(BUILD_ID),
    },
    plugins: [tailwindcss()],
  },
});
