# Design System Maestro: Neobrutalismo Accesible y Comercial (AIDA)

Este sistema de diseño fusiona la **Honestidad Radical** del Neobrutalismo gráfico con las directrices neurocognitivas de **accesibilidad para la dislexia y baja visión (WCAG 2.2 AAA / Criterio 1.4.12)** y la arquitectura de conversión comercial **AIDA** (*Atención, Interés, Deseo, Acción*).

---

## 1. Fundamentos y Reglas de Diseño

### A. Tipografía Neurocognitiva y Legibilidad

Basado en evidencia sobre el déficit fonológico y magnocelular en entornos de lectura digital:

1. **Erradicación del *Crowding* Visual (Apiñamiento):** El aumento de espaciado debe ser estrictamente balanceado. Si se incrementa el `letter-spacing` (0.02em), es obligatorio aumentar proporcionalmente el `word-spacing` (0.16em). El incremento unilateral de interletraje sin compensar la palabra deteriora la velocidad de decodificación.
2. **Interlineado (`line-height`):** Fijado en `1.6` para texto base continuo (rango óptimo accesible de 1.5 a 1.8).
3. **Longitud de Línea (Control Sacádico):** Ancho de lectura limitado a un máximo estricto de `65ch` (`max-width: 65ch`) para evitar saltos de línea erróneos y fatiga ocular.
4. **Alineación:** Siempre alineado a la izquierda (`text-align: left`). **Prohibido el texto justificado** (`text-align: justify`), ya que genera canales verticales vacíos ("ríos de blanco") que desorientan al lector con dislexia.
5. **Familias Tipográficas:** Sans-serif directas de alta legibilidad (*Inter, DM Sans, Arial, 'Segoe UI'*) para cuerpo; fuentes pesadas y contundentes (*Syne, Archivo Black*) para titulares; fuentes monoespaciadas (*JetBrains Mono*) para terminales y código.

### B. Color y Mitigación del Estrés Visual (Síndrome de Irlen)

* **Prohibición del Contraste Extremo (21:1):** El negro puro (`#000000`) sobre blanco puro (`#FFFFFF`) genera aberración óptica, destellos y fatiga visual severa.
* **Paleta Anti-Estrés Visual:**
  * **Fondo de lienzo:** Papel ahumado / Marfil suave (`#f5f5f0`).
  * **Fondo de contenedores:** Blanco neutro (`#ffffff`).
  * **Tinta y bordes:** Carbón profundo / Zinc (`#1a1a18`), logrando una relación de contraste calculada de **16.5:1 (WCAG AAA)** sin deslumbramiento.
  * **Acentos Funcionales:** Amarillo atención (`#FFD23F`), Rosa deseo (`#FF6B6B`), Azul interés (`#74B9FF`), Verde éxito (`#2ECC71`) y Rojo error (`#DC2626`).

### C. Física Canónica Neobrutalista

* **Bordes:** Líneas sólidas de `3px` (desktop) y `2px` (móvil) en `#1a1a18`.
* **Sombras Duras (*Hard Offset Shadows*):** Blur estrictamente en `0px` (`3px 3px 0px 0px #1a1a18`, `5px 5px 0px 0px #1a1a18`, `8px 8px 0px 0px #1a1a18`).
* **Cinemática 1:1:** Al interactuar en `:active`, el botón se desplaza exactamente la profundidad de su sombra (`transform: translate(5px, 5px)`) y su sombra se cancela (`0px`), emulando un pulsador mecánico real.
* **Seguridad Vestibular:** Todo movimiento cinemático se desactiva ante la preferencia `@media (prefers-reduced-motion: reduce)`.
* **Focos de Accesibilidad:** Indicador persistente `:focus-visible` con `outline: 3px solid #1a1a18` y `outline-offset: 4px`.

### D. Integración del Framework AIDA en Bento Grids

| Etapa AIDA | Elemento UI Neo-Brutalista | Función Neurocognitiva / CRO |
| --- | --- | --- |
| **Atención (A)** | Titulares display masivos, badges amarillos de alto impacto y microgrids. | Genera el Efecto Von Restorff (aislamiento visual) para detener el scroll. |
| **Interés (I)** | Módulos Bento asimétricos alineados a 8px y cajas de consola técnica. | Facilita el *chunking* cognitivo organizando datos en unidades escaneables. |
| **Deseo (D)** | Tarjetas de métricas transparentes y switch para "Modo Dislexia" expandido. | Construye autoridad y confianza eliminando patrones visuales engañosos. |
| **Acción (A)** | Botones primarios dominantes con física táctil 1:1 y áreas de toque >= 44x44px. | Elimina la fricción decisional mediante una confirmación visual predecible. |

---

## 2. Implementación de Tokens y Variables CSS

```css
:root {
  --bg-canvas: #f5f5f0;
  --bg-surface: #ffffff;
  --text-main: #1a1a18;
  --text-muted: #575752;

  --accent-attention: #FFD23F;
  --accent-desire: #FF6B6B;
  --accent-interest: #74B9FF;
  --accent-success: #2ECC71;
  --accent-error: #DC2626;

  --border-width-desktop: 3px;
  --border-width-mobile: 2px;
  --border-color: #1a1a18;
  --border-main: var(--border-width-desktop) solid var(--border-color);
  --radius-strict: 0px;

  --shadow-sm: 3px 3px 0px 0px var(--border-color);
  --shadow-md: 5px 5px 0px 0px var(--border-color);
  --shadow-lg: 8px 8px 0px 0px var(--border-color);
  --shadow-active: 0px 0px 0px 0px var(--border-color);

  --font-display: 'Syne', 'Archivo Black', -apple-system, sans-serif;
  --font-body: 'Inter', 'DM Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  
  --line-height-body: 1.6;
  --letter-spacing-body: 0.02em;
  --word-spacing-body: 0.16em;
  --max-width-text: 65ch;
  
  --focus-outline: 3px solid var(--border-color);
  --focus-offset: 4px;
}
```
