# Auditoría 1-a-1 del interlineal — reporte final

**Fechas:** 23–26 sep 2026 · **Alcance:** 66 libros, 31.105 versículos, 557.676 palabras
**Referencia:** interlineal público de contraste (BHS hebreo / Tischendorf griego) · **Método:** `scripts/audit-interlinear.py`
(1 hilo, ~2,5 s/verso, backoff ante 429/5xx, progreso reanudable en JSONL)

## Resultado global

| Estado | Versículos |
|---|---|
| OK | 30.883 (99,35 %) |
| Con diferencias (corregidos) | 150 |
| Faltantes en local (rellenados) | 70 + 1 fantasma |
| Errores de red | 0 |

Criterios por palabra: texto manuscrito exacto, número Strong, glosa en español,
parsing y conteo de palabras por versículo.

## Correcciones aplicadas

| Tipo | Casos | Ejemplos |
|---|---|---|
| Typos en glosas | ~30 | `viendo→viento` (Ex 14:21), `Cafés→Cades` (Nm 20:1), `mujeress→mujeres` (Pr 14:1), `mostro→mosto` (Sal 4:7), `oías→odías` (Sal 5:5) |
| Tiempos verbales | 3 | `quemas→quemarás` (Ex 29:13), `traiga→traerá` (Ex 35:5) |
| Puntuación/maquetación | 4 | `¿así/así?` (Gn 3:1), coma de más (Gn 39:4), `señales]]` (Mr 16:20) |
| Entidades HTML | 2 | `&#39;` sin decodificar (Gn 17:11, 17:27) |
| Strong | 2 | Sal 17:15 (6972→6974), Mt 23:26 (1623→1622 + glosa) |
| Texto manuscrito | 1 | Jn 10:22 (`ἐνκαίνια→ἐγκαίνια`) |
| Glosas profeta/vocero | 115+37 | ver nota abajo |
| Versos Éxodo recuperados | 70 | Ex 23, 25, 28–30, 32, 35–38 (faltaban en origen NRVA) |

## Nota vocero/profeta (importante)

La referencia es **inconsistente consigo misma**: dice `profeta` en parte de Mateo
(Mt 1:22, 2:5…) y `vocero` en el resto (incluido el resto de Mateo, Lucas, Juan,
Hechos…). Un reemplazo global en cualquier dirección queda mal; la regla correcta
fue imponer el valor remoto **verso por verso** (`scripts/apply-audit-fixes.py` +
verificación dedicada de 176 versículos G4396/G4395/G4394/G5578). Quedamos espejo
fiel de la referencia. Uniformar todo a `profeta` sería decisión editorial, no de
fidelidad.

## Casos especiales

- **Sal 47:10:** versículo fantasma — existe la clave pero con 0 palabras en la
  referencia. Se descartó (no se inventó contenido).
- **Jn 1:38–51 y 2Co 13:12–13:** difieren en conteo contra Tischendorf 8ª ed. pero
  coinciden con la referencia: es versificación de Tischendorf, no error local.
- **1–2 Samuel, Reyes, Crónicas:** el sitio los nombra `1ra Samuel` etc.; el mapa
  de libros se normalizó (`norm_name`) para no saltarlos (554 versos afectados).
- **Lc 22:14:** único fallo de red; reintentado OK al relanzar.

## Enriquecimiento derivado

- `lemma` + `parsingCode` en las 557.676 palabras (griego: Tischendorf PD v2.7,
  verificado 99,6 %; hebreo: captura + backfill de red).
- `public/data/interlinear/strong-occurrences.json`: índice Strong→versículos
  (13.719 claves H/G).
- UI: lema y código en el interlineal, "aparece en N versículos" en Strong,
  descripciones de códigos (`Morphology.ts`), página Acerca de con créditos.

## Fuentes y licencias

- Texto griego Tischendorf 8ª ed. (Yale / Robinson / Sandborg-Petersen): **dominio público**.
- Texto hebreo WLC vía Open Scriptures: abierto.
- Datos STEPBible (léxicos/códigos): **CC BY 4.0** (crédito en Acerca de).
- Glosas y validación: contraste automático contra un interlineal público; los datos que sirve la app son propios.

## Scripts

- `scripts/audit-interlinear.py` — barrido (`--resume`, `--start-url`, `--capture`)
- `scripts/apply-audit-fixes.py` — aplica diffs (`--apply`; dry-run por defecto)
- `scripts/fill-missing-verses.py` — rellena `missing_local`
- `scripts/backfill-hebrew-lemma.py` — backfill de lemas (captura + red)
- `scripts/certify-fixes.py` — re-audita solo versos tocados
- `scripts/enrich-interlinear-greek.py` — enriquecimiento desde Tischendorf

## Certificación

Re-auditoría de los 220 versículos tocados + verificación dedicada de 176
versículos con familia G4396: **cero diferencias** contra la referencia.
