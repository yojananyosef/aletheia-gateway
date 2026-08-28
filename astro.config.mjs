import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
const BUILD_ID = Date.now().toString(36);

export default defineConfig({
  integrations: [svelte()],
  vite: {
    define: {
      __BUILD_ID__: JSON.stringify(BUILD_ID),
    },
    plugins: [tailwindcss()],
  },
});
