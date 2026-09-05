# SPEC (futuro): Gateway ← aletheia-catalog (.amod / AMF v1)

> Estado: **propuesta documentada, sin implementar**. Prerrequisito: el catálogo debe
> publicar primero las versiones en español (hoy solo ASV, KJV, SME, SMITH).
> Decisión registrada 2026-09-05: upstream oficial = `aletheia-catalog`
> (frente a `aletheia-modules`: mejor inventario hoy pero binarios en-repo y sin spec).

## 1. Objetivo

Sacar los ~315MB de `public/data/` del repo del gateway sin cambiar el runtime:
el lector sigue consumiendo **JSON por libro** vía `fetch`. El catálogo pasa a ser
el *source of truth* versionado (módulos `.amod` deterministas con sha256);
un ETL en CI convierte `.amod` → JSON actual y publica donde el gateway los lea.

Lo que explícitamente NO se hará: leer SQLite/WASM (`sql.js`) en el navegador.
El runtime del gateway no toca `.amod`; solo JSON, como hoy.

## 2. Punto de partida (verificado 2026-09-05)

- Datos: `public/data/{bibles(139M),commentaries(86M),concordance(81M),cross-references(7.5M),devotionals(1.5M)}`, `.git` de 103MB. Historial: **no reescribir** (decisión).
- Carga runtime (lazy por libro, bien diseñada — conservar):
  - `src/modules/bible-reader/infrastructure/JsonBibleRepository.ts` → `/data/bibles/{id}/{book}.json`
  - `src/modules/commentaries/infrastructure/JsonCommentaryRepository.ts` → `/data/commentaries/index.json` + `/{fuente}/{libro}.json`
  - `src/modules/concordance/application/ConcordanceService.ts` → `/data/concordance/{id}.json` (9MB por versión, solo ES)
  - `src/modules/cross-references/infrastructure/JsonCrossReferenceRepository.ts` → `/data/cross-references/TSK/{BOOK}.json`
  - `src/modules/devotionals/infrastructure/JsonDevotionalRepository.ts` → `/data/devotionals/sme-spurgeon.json`
  - Todas usan `cacheBust()` (`src/shared/utils/cacheBust.ts`) y `manifest.json` generado por `scripts/generate-manifest.ts`.
- Catálogo: `catalog/catalog.json` en `yojananyosef/aletheia-catalog` (raw.githubusercontent,
  CORS `*` ✓) + `.amod` en GitHub Releases (`releases/latest/download`, verificar CORS
  en assets antes de depender de fetch directo desde navegador).

## 3. Trabajo previo en el catálogo (lado catálogo, antes de tocar el gateway)

1. Importar lote ES con el ETL existente: RV1909, BES, VBL, PDDPT, ONBV, BLL, BLM,
   SpaPlatense, SpaRVG (licencias CC/PD verificadas según `docs/content-policy.md`).
2. Importar comentarios ES disponibles + TSK (verificar que el TSK del catálogo sea
   completo: 66 libros — el stub de 5KB visto en `aletheia-modules` NO sirve de referencia).
3. Publicar release y regenerar `catalog.json` (sha256 por módulo).
4. Definir (si no existe) el mapeo `id catálogo ↔ TranslationId gateway` y directorios
   de comentarios por libro compatibles con `/{fuente}/{libro}.json`.

## 4. Diseño de integración (lado gateway)

### 4.1. `DATA_BASE_URL` centralizado
- Nueva constante (env `PUBLIC_DATA_BASE_URL`, default `''` = actual `/data` local):
  p. ej. `https://raw.githubusercontent.com/...` o bucket/CDN + `catalog.json`.
- Los 5 repositorios construyen URLs como `${DATA_BASE_URL}/bibles/...` en vez de
  `/data/...`. `cacheBust()` se mantiene (añade `?v=` — compatible con raw/hosting).
- **Fallback local**: si el fetch remoto falla (offline, CORS), reintentar contra
  `/data/...` empaquetado. Implementar el fallback en un `fetchJsonWithFallback()`
  compartido (nuevo `src/shared/utils/remote-data.ts`), no en cada repo.

### 4.2. ETL `.amod` → JSON gateway (CI del gateway o repo intermedio)
- Job que, por cada `TranslationId` mapeado: descarga el `.amod` (verifica sha256
  contra `catalog.json`), abre `content.db` (SQLite), vuelca capítulos/versículos al
  esquema actual (`versionId/bookCode/chapters/{n}/verses[]`), y genera:
  - `public/data/bibles/{id}/{BOOK}.json` (o los sube al hosting con la misma ruta),
  - `manifest.json` (reusar `scripts/generate-manifest.ts` o generarlo del catálogo),
  - índices de concordancia (reusar `scripts/generate-concordance-index.ts` sobre el
    texto volcado; define si van 9 o 22 versiones).
- Comentarios/cross-refs/devocionales: mismo patrón por libro/fuente si el catálogo
  los publica; si no, esos datasets siguen en-repo hasta su importación.

### 4.3. Versionado y caché
- `catalog.json` trae `version` + `sha256` por módulo → el ETL fija versiones
  (builds reproducibles) y el `?v=` de `cacheBust()` puede derivarse del sha.
- `vercel.json` ya fija `must-revalidate` en `/data/*`; si el hosting es externo,
  configurar `Cache-Control: public, max-age=31536000, immutable` por URL versionada.

## 5. Criterios de aceptación

1. `git clone` del gateway < 50MB y `public/data/` deja de crecer en el repo.
2. Suite actual intacta: 26 unit + e2e (home, lector, settings, estilos) en verde
   contra datos remotos (el smoke debe correr con `DATA_BASE_URL` apuntando al
   staging del catálogo).
3. Paridad de contenido: diff automatizado muestra 0 diferencias en versículos ES
   entre JSON actual y JSON generado del catálogo (muestra mínima: GEN, PSA, JHN, REV).
4. Offline/fallback: con el remoto caído, la app sirve el subset local empaquetado.
5. Licencias: cada módulo consumido tiene `license` + `attribution` visibles
   (el aviso por columna del lector ya existe; alimentarlo del `manifest` del catálogo).

## 6. Riesgos y notas

- CORS en assets de Releases: verificar `Access-Control-Allow-Origin` en
  `objects.githubusercontent.com` antes de fetch directo; si falla, el ETL en CI
  (lado servidor, sin CORS) sigue siendo válido y el hosting final lo sirve con CORS.
- `aletheia-modules` queda como referencia de inventario, no como upstream.
- Concordancias EN/PT/LA/DE/EL/HE: pendientes en ambos lados; generarlas del catálogo
  cuando publique esos módulos (mismo ETL, §4.2).
- TSK completo (66/66) ya verificado en-gateway (v0.11.5); exigir lo mismo al módulo
  del catálogo antes de migrar cross-refs.
