import type { APIRoute } from "astro";

/**
 * Manifest generado en build para que `start_url`, `scope` e iconos respeten
 * la base del sitio (GitHub Pages usa /aletheia-gateway/; un dominio propio /).
 */
export const GET: APIRoute = () => {
  const base = import.meta.env.BASE_URL;
  const icon = (src: string, sizes: string, type: string, purpose: string) => ({
    src: `${base}${src}`,
    sizes,
    type,
    purpose,
  });

  const manifest = {
    name: "Aletheia Gateway — Lee y compara la Biblia",
    short_name: "Aletheia",
    description:
      "Plataforma de lectura bíblica en español con comparador multi-versión, devocionales y biblioteca de estudio.",
    lang: "es",
    start_url: base,
    scope: base,
    display: "standalone",
    orientation: "any",
    theme_color: "#FFD23F",
    background_color: "#f5f5f0",
    icons: [
      icon("icon-192.png", "192x192", "image/png", "any"),
      icon("icon-512.png", "512x512", "image/png", "any"),
      icon("icon-512.png", "512x512", "image/png", "maskable"),
      icon("icon.svg", "any", "image/svg+xml", "any"),
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json" },
  });
};
