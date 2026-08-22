# AlethiaGateway 📖⚡

> *«Conoceréis la verdad, y la verdad os hará libres.»*  
> **AlethiaGateway** es una plataforma web moderna, ultrarrápida y accesible para la lectura, búsqueda y estudio comparativo de la Biblia en español.

---

## 📌 Tabla de Contenidos
- [Características Principales](#-características-principales)
- [Estrategia de Versionado (SemVer)](#-estrategia-de-versionado-semver)
- [Arquitectura de Software](#-arquitectura-de-software)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Primeros Pasos](#-primeros-pasos)
- [Comandos Disponibles](#-comandos-disponibles)
- [Historial de Cambios (Changelog)](#-historial-de-cambios-changelog)
- [Licencia](#-licencia)

---

## ✨ Características Principales

- **⚡ Arquitectura de Islas con Zero-JS por Defecto**: Construido sobre **Astro 5** para máxima velocidad de carga y SEO óptimo.
- **🔄 Comparador Multiversión en Paralelo**: Contrasta hasta 5 traducciones en español simultáneamente (*RVC, NBLA, NVI, NTV, TLA*) en columnas interactivas.
- **🎨 Sistema de Diseño Neobrutalista**: Estética retro-moderna con contornos negros marcados, sombras duras (`box-shadow: 5px 5px 0 #000`) y paleta de alto contraste.
- **📱 Sidebar y Topbar Adaptables (AppShell)**: Modo expandido (`260px`), colapsado compacto tipo riel (`72px`) para escritorio y cajón móvil (*drawer*) con fondo translúcido.
- **🔖 Biblioteca y Marcadores Locales**: Persistencia de lecturas y pasajes guardados en el navegador mediante `localStorage`.
- **🧩 Principios SOLID & Screaming Architecture**: Separación estricta entre Dominio, Casos de Uso, Infraestructura y Presentación.

---

## 🏷️ Estrategia de Versionado (SemVer)

Este proyecto adopta estrictamente la especificación **[Semantic Versioning 2.0.0 (SemVer)](https://semver.org/)**.

El formato de versión sigue el esquema: `MAJOR.MINOR.PATCH` (ej. `v1.0.0`):

| Segmento | Incremento Cuando... | Ejemplo |
| :--- | :--- | :--- |
| **MAJOR (X.0.0)** | Se introducen cambios incompatibles o de ruptura en la arquitectura o contratos de API/Dominio. | `1.0.0` → `2.0.0` |
| **MINOR (0.X.0)** | Se añade nueva funcionalidad de negocio retrocompatible (ej. nuevo proveedor de audio, sistema de notas). | `1.0.0` → `1.1.0` |
| **PATCH (0.0.X)** | Se realizan correcciones de errores, ajustes de estilos o parches retrocompatibles. | `1.0.0` → `1.0.1` |

---

## 🏛️ Arquitectura de Software

La aplicación implementa **Clean Architecture** y **Screaming Architecture**:

```mermaid
graph TD
    A[Capa de Presentación: Astro Pages + Svelte 5 Islands] --> B[Capa de Aplicación: Use Cases]
    B --> C[Capa de Dominio: Entities, Value Objects, Repository Interfaces]
    D[Capa de Infraestructura: MockRepo / LocalStorage / API Adapter] -.->|Implementa DIP| C
    B --> D
```

### Principios SOLID en el Código:
- **S (Single Responsibility):** Entidades como `PassageReference` solo se encargan del parseo y validación de citas bíblicas.
- **O (Open/Closed):** Nuevas fuentes de datos bíblicas se añaden implementando `IBibleRepository` sin modificar casos de uso.
- **L (Liskov Substitution):** Adaptadores locales o remotos son sustituibles de forma transparente.
- **I (Interface Segregation):** Interfaces reducidas y especializadas (`IBibleRepository`, `IBookmarkRepository`).
- **D (Dependency Inversion):** Los componentes y la aplicación dependen de abstracciones (interfaces), nunca de implementaciones concretas.

---

## 🛠️ Stack Tecnológico

- **Framework Web**: [Astro 5](https://astro.build/)
- **Librería de UI / Reactividad**: [Svelte 5](https://svelte.dev/) con *Runes* (`$state`, `$derived`, `$props`, `$effect`)
- **Estilos y Utilidades**: [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`, `clsx`, `tailwind-merge`)
- **Iconografía**: [Lucide Svelte](https://lucide.dev/)
- **Lenguaje**: [TypeScript 5.9](https://www.typescriptlang.org/)
- **Entorno / Gestor de Paquetes**: [Bun](https://bun.sh/)

---

## 📁 Estructura del Proyecto

```text
alethiagateway/
├── public/
│   ├── favicon.svg                # Monograma vectorial Neobrutalista
│   ├── favicon.ico                # Favicon binario ICO estándar
│   └── icon.svg
├── src/
│   ├── modules/                   # Módulos de dominio de negocio (Screaming)
│   │   ├── bible-reader/          # Módulo principal de lectura bíblica
│   │   │   ├── domain/            # Entities, Value Objects, IBibleRepository
│   │   │   ├── application/       # CompareTranslations, GetChapter, Search
│   │   │   ├── infrastructure/    # MockBibleRepository, bible-data
│   │   │   └── ui/                # Componentes Svelte 5 (BibleReaderApp, ReaderView, etc.)
│   │   └── bookmarks/             # Módulo de biblioteca y favoritos
│   │       ├── domain/            # Bookmark, IBookmarkRepository
│   │       └── infrastructure/    # LocalStorageBookmarkRepository
│   ├── shared/
│   │   ├── ui/                    # AppShell.svelte, Sidebar.svelte, Topbar.svelte
│   │   ├── styles/                # globals.css (Tokens neobrutalistas)
│   │   └── utils/                 # cn.ts
│   ├── layouts/
│   │   └── RootLayout.astro       # Shell HTML, fuentes y metadatos SEO
│   └── pages/
│       └── index.astro            # Punto de entrada con hidratación de islas
├── astro.config.mjs
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🚀 Primeros Pasos

### Requisitos Previos
- Tener instalado [Bun](https://bun.sh/) (v1.1+ recomendado) o [Node.js](https://nodejs.org/) (v20+).

### Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/alethiagateway.git
   cd alethiagateway
   ```

2. Instalar dependencias:
   ```bash
   bun install
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   bun run dev
   ```
   Abre [http://localhost:4321](http://localhost:4321) en tu navegador.

---

## 📜 Comandos Disponibles

| Comando | Descripción |
| :--- | :--- |
| `bun run dev` | Inicia el servidor de desarrollo local de Astro. |
| `bun run build` | Compila y optimiza la aplicación para producción en `dist/`. |
| `bun run preview` | Previsualiza localmente el build de producción. |
| `bun run check` | Ejecuta el análisis estático de tipos TypeScript y diagnósticos de Astro. |

---

## 📋 Historial de Cambios (Changelog)

### [0.4.1] - 2026-08-21
#### Añadido & Búsqueda Avanzada Estilo BibleGateway
- 🔍 **Buscador Multi-Pasajes y Nomenclaturas Flexibles**:
  - Soporte de múltiples pasajes en una sola búsqueda separados por punto y coma (ej. `Genesis 1:1; Génesis 2:1-2; Gen 3:1,6; 5`).
  - Reconocimiento de variaciones fonéticas, abreviaturas (`Gen`, `1Cor`, `Sal`, `Lv`), omisión de tildes y versículos discontinuos con comas (`3:1,6`).
  - Herencia automática de contexto del libro en listas compuestas (ej. `5` tras `Gen 3:1,6` se interpreta como `Génesis 5`).
- 📜 **Apilamiento Vertical de Bloques de Pasajes**:
  - Cada pasaje consultado se lista verticalmente hacia abajo con su propio identificador y botón interactivo `[ 📖 Leer el capítulo completo ➔ ]`.
- 📌 **Notas al Pie al Final con Enlaces Interactivos**:
  - Llamadas de nota en superíndice `[*]` junto al versículo con desplazamiento suave al pulsar hacia la sección de notas al pie al final de la columna.
- ⚖️ **Aviso Legal y Derechos de Autor por Columna**:
  - Bloque tipográfico al pie de cada versión mostrando nombre oficial, titularidad y licencia de uso (ej. *Biblica® Nueva Biblia Viva, © Biblica, Inc.*).

### [0.4.0] - 2026-08-21
#### Añadido & Ingesta Real de Datos
- 📖 **7 Versiones Bíblicas Reales y Completas en JSON**:
  - Ingesta y conversión de más de 9.500 archivos HTML en `public/data/bibles/` organizados por libros y capítulos.
  - Versiones integradas: **RV1909** (*Reina Valera 1909*), **BES** (*Biblia en Español Sencillo*), **VBL** (*Versión Biblia Libre*), **PDDPT** (*Palabra de Dios para ti*), **ONBV** (*Open Nueva Biblia Viva*), **BLL** (*Biblia Libre Latinoamericano*), **BLM** (*Biblia Libre para el Mundo*).
- 🏷️ **Soporte Total de Metadatos Bíblicos**:
  - Extracción y renderizado de títulos y encabezados de sección (`.verse-section-heading`).
  - Extracción y renderizado de notas al pie y variantes textuales por versículo (`.verse-footnote-item`).
- ⚡ **Repositorio `JsonBibleRepository`**:
  - Carga diferida (*lazy loading*) con caché en memoria por libro para una experiencia de lectura fluida e instantánea (0ms de latencia).
  - Eliminación total de datos simulados/hardcodeados.
- 🛠️ **Pipeline Automatizado CLI (`scripts/convert-bibles.ts`)**:
  - Script en Bun/TypeScript para parseo de alta velocidad de biblias en HTML hacia esquemas JSON estructurados.

### [0.3.2] - 2026-08-21
#### Añadido & Rediseñado
- 🏠 **Rediseño del Inicio al Estilo BibleGateway**:
  - Buscador principal superior con placeholder limpio y sin textos hardcodeados.
  - Sub-barra de herramientas con acceso directo al modal de libros bíblicos y selector de tamaño de fuente.
  - Tarjeta destacada única de **Versículo del Día** con enlace directo para leer el capítulo completo en el lector.
  - Ajuste de altura compacto al viewport sin scroll vertical innecesario.
  - Ancho unificado y coherente con la vista de lectura bíblica (`1200px` / `1440px`).
  - Escalado tipográfico reactivo del Versículo del Día al cambiar el tamaño de fuente.

### [0.3.1] - 2026-08-21
#### Añadido & Mejorado
- 🖍️ **Motor de Resaltado Bíblico (Estilo BibleGateway)**: Barra de herramientas flotante al seleccionar texto con 4 colores (amarillo, coral, azul, verde), borrador de resaltado, copiado rápido con cita formateada y notas.
- 🎨 **Selector de Versión por Columna Neobrutalista Flotante**: Menú desplegable sin scrollbars artificiales que desborda limpiamente por encima del contenedor con sombra dura y cierre al hacer clic fuera (*click-outside*).
- 🔍 **Buscador Alargado Superior**: Barra de búsqueda a ancho completo (`100%`) en la cabecera del lector, eliminando encabezados gigantes redundantes y maximizando el espacio de lectura.
- ◀ ▶ **Botones Flotantes Exteriores y Centrados**: Navegación de capítulos situada en el eje vertical medio exacto de la tarjeta y fuera del área de versículos para evitar solapamientos.
- 📐 **Altura Adaptativa al Contenido**: El contenedor del lector ajusta dinámicamente su altura según la cantidad de versículos en pantalla.
- 🎨 **Sombreado Temático de Selección (`::selection`)**: El texto seleccionado adopta el color principal del tema activo (`#FFD23F` en modo estándar y `#ffeaa7` en Modo Calma).
- 📐 **Selector de Tamaño de Fuente Ampliado**: Menú espacioso con etiquetas legibles sin truncamiento (`X-Grande` a `X-Pequeño`).
- 🧹 **Limpieza de Elementos Redundantes**: Eliminación del anuncio inferior («Guarda tu lectura»), del botón de compartir no funcional y de las flechas redundantes en la barra de herramientas.

### [0.3.0] - 2026-08-21
#### Añadido
- 🗂️ **Botón «+ Agregar paralelo»**: Adición dinámica de hasta 5 versiones en paralelo, eliminando botones fijos y optimizando espacio.
- 🔄 **Selector de Versión por Columna**: Menú desplegable neobrutalista individual por columna con botón de cierre (`✕`) dedicado.
- 📖 **Modal «Lista de libros bíblicos»**: Selector estructurado en 3 columnas (Antiguo Testamento, Nuevo Testamento y Capítulos) con filtro de búsqueda instantáneo.
- 🔤 **Selector de Tamaño de Fuente**: Menú de ajuste tipográfico (X-Grande, Grande, Medio, Pequeño, X-Pequeño) con persistencia en `localStorage`.
- ◀ ▶ **Navegación de Capítulos Optimizada**: Botones laterales táctiles esbeltos e indicadores integrados en la barra de herramientas.
- 📱 **Sidebar Móvil Refinado**: Cajón amplio y limpio que se cierra haciendo clic fuera sin elementos invasivos.
- 🎯 **Foco Limpio en Buscador**: Borde negro enfocado exclusivamente en el campo de texto.

### [0.2.0] - 2026-08-21
#### Añadido
- 🧠 **Design System Maestro**: Integración de pautas neurocognitivas WCAG 2.2 AAA / Criterio 1.4.12, control sacádico de lectura (`65ch`), tipografías (`Syne`, `Archivo Black`, `Inter`, `JetBrains Mono`, `Lexend`) y cinemática mecánica 1:1.
- ✨ **Modo Calma & Dislexia**: Alternador de tema suave anti-estrés visual (`body.mode-calm`) con persistencia en `localStorage`.
- 📖 **Comparador de 5 Versiones Continuo**: Lectura en paralelo en una sola fila horizontal fluida con crecimiento vertical dinámico.
- 📐 **Expansión Dinámica de Espacio**: Adaptación automática a `1420px` al colapsar el sidebar.
- 🎚️ **Scrollbar Temático Neobrutalista**: Barra de desplazamiento aislada debajo del Topbar respetando el tema activo.
- 🔍 **Buscador con Marco Interior de Selección**: Efecto de marco negro definido al enfocar/seleccionar sin cortar el icono.

### [0.1.0] - 2026-08-21 (Propuesta Inicial)
#### Añadido
- ✨ Migración completa de la arquitectura base desde Next.js a **Astro 5 + Svelte 5**.
- 🏛️ Reestructuración bajo **Screaming Architecture** y principios **SOLID**.
- 📖 Comparador multiversión en paralelo con soporte de hasta 5 traducciones en español (`RVC`, `NBLA`, `NVI`, `NTV`, `TLA`).
- 🎨 Sistema de diseño **Neobrutalista** con soporte fluido de viewport en pantalla completa.
- 📱 Componente unificado `AppShell.svelte` con Sidebar colapsable (`260px` ↔ `72px`) y modo cajón móvil.
- 🔖 Sistema de persistencia de marcadores con `LocalStorageBookmarkRepository`.
- 🖼️ Iconografía y favicon oficial (`favicon.svg` y `favicon.ico`) con monograma AlethiaGateway.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.
