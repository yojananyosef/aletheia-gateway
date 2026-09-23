import { expect, test } from '@playwright/test';

test('home carga con buscador y marca Aletheia', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AletheiaGateway/);
  await expect(page.getByPlaceholder(/Ingrese pasaje/)).toBeVisible();
});

test('navegación al lector paralelo', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Leer la Biblia' }).first().click();
  await expect(page.getByText('Agregar paralelo').first()).toBeVisible();
});

test('modal de configuración: las 3 pestañas renderizan', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Configuración' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await expect(page.getByText('Tema Visual')).toBeVisible();

  await page.getByRole('button', { name: 'Copias de Seguridad' }).click();
  await expect(page.getByText('Centro de Respaldos')).toBeVisible();

  await page.getByRole('button', { name: 'Acerca de' }).click();
  await expect(page.getByText('22 Traducciones')).toBeVisible();

  await page.getByRole('button', { name: 'Apariencia' }).click();
  await expect(page.getByText('Tema Visual')).toBeVisible();
});

test('CBA: anclas por versículo, drawer y lectura completa', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Leer la Biblia' }).first().click();

  const cbaBadges = page.locator('.verse-cba-indicator-btn');
  await expect(cbaBadges.first()).toBeVisible({ timeout: 20000 });

  await cbaBadges.first().click();
  await expect(page.getByText('Comentario Bíblico Adventista').first()).toBeVisible();
  await expect(page.getByText('En el principio.').first()).toBeVisible();

  await page.getByRole('button', { name: /Lectura completa del comentario/ }).click();
  await expect(page.getByText('Versículo 1').first()).toBeVisible();
});

test('Strong: diccionario, búsqueda y detalle con audio', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Strong' }).first().click();
  await expect(page.getByRole('heading', { name: 'Diccionario Strong' })).toBeVisible();

  await page.getByLabel('Buscar en el diccionario Strong').fill('abuelo');
  await expect(page.getByText('אָב').first()).toBeVisible({ timeout: 20000 });

  await page.getByText('אָב').first().click();
  await expect(page.getByText('Strong hebreo #1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Escuchar pronunciación' })).toBeVisible();
});

test('Interlineal: palabras hebreas y salto al Strong', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Interlineal' }).first().click();
  await expect(page.getByRole('heading', { name: 'Interlineal Hebreo' })).toBeVisible();

  const firstWord = page.locator('.interlinear-original').first();
  await expect(firstWord).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.interlinear-words')).toContainText('principio');

  await page.locator('.interlinear-strong', { hasText: '7225' }).click();
  await expect(page.getByText('Strong hebreo #7225')).toBeVisible();
});

test('estilos con scope: botones y títulos conservan diseño tras el split', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Configuración' }).click();

  const titleWeight = await page.getByText('Tema Visual').evaluate((el) => getComputedStyle(el).fontWeight);
  expect.soft(titleWeight === '800' || titleWeight === '700').toBeTruthy();

  await page.getByRole('button', { name: 'Copias de Seguridad' }).click();
  const exportBtn = page.getByRole('button', { name: /Descargar Backup/ });
  await expect(exportBtn).toBeVisible();
  const border = await exportBtn.evaluate((el) => getComputedStyle(el).borderTopWidth);
  const shadow = await exportBtn.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(border).toBe('2px');
  expect(shadow).not.toBe('none');
});

test('tracker: vista de progreso con racha y capítulos', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mi progreso' }).first().click();
  await expect(page.getByText('Mi progreso de lectura')).toBeVisible();
  await expect(page.getByText(/capítulos \(/)).toBeVisible();

  // Marcar Génesis 1 como leído y verificar persistencia visual
  const gen = page.locator('details.tracker-book', { hasText: 'Génesis' }).first();
  await gen.locator('summary').click();
  const ch1 = gen.getByRole('button', { name: 'Génesis 1 (pendiente)' });
  await ch1.click();
  await expect(gen.getByRole('button', { name: 'Génesis 1 (leído)' })).toBeVisible();
});

test('headings overlay: RV1909 muestra títulos sin chocar con nativos', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Leer la Biblia' }).first().click();

  // RV1909 Génesis 1 no trae headings nativos → overlay NRVA
  const overlay = page.locator('.verse-section-heading[data-heading-source="overlay"]');
  await expect(overlay.first()).toBeVisible({ timeout: 20000 });
  await expect(overlay.first()).toContainText('La creación');
});

test('planes: vista propia separada de devocionales (sin crash annual-thematic)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Planes de lectura', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Planes de lectura' })).toBeVisible();

  // Una sola marca activa en el sidebar (antes se iluminaban Devocionales + Planes)
  await expect(page.locator('.neo-nav-button.is-active')).toHaveCount(1);

  await page.getByRole('button', { name: /Plan Anual Temático/ }).click();
  await expect(page.getByText('El Origen').first()).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole('button', { name: 'Génesis 1' })).toBeVisible();

  // Ref EGW { label, chapterId } se resuelve contra el libro local (era el crash .split)
  await page.getByText('Patriarcas y Profetas, Cap. 2').first().click();
  const egwBody = page.locator('details.plan-egw[open] .plan-egw-body');
  await expect(egwBody.getByText('Dios').first()).toBeVisible({ timeout: 20000 });

  // Devocionales ya no mezcla planes
  await page.getByRole('button', { name: 'Devocionales' }).first().click();
  await expect(page.getByRole('button', { name: 'Planes de lectura ES' })).toHaveCount(0);
});

test('planes: marcar día como completado y ver progreso en el card', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Planes de lectura', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Planes de lectura' })).toBeVisible();

  await page.getByRole('button', { name: /El Libro de Daniel/ }).click();
  await expect(page.getByText('Día 1 de 16').first()).toBeVisible({ timeout: 20000 });

  await page.getByRole('button', { name: 'Marcar día como completado' }).click();
  await expect(page.getByRole('button', { name: 'Marcar día como pendiente' })).toBeVisible();
  await expect(page.getByText('Día completado').first()).toBeVisible();
  await expect(page.getByText('1 completados').first()).toBeVisible();

  await page.getByRole('button', { name: 'Todos los planes' }).click();
  const danielCard = page.getByRole('button', { name: /El Libro de Daniel/ });
  await expect(danielCard.getByText('1 de 16 días').first()).toBeVisible();
});

test('interlineal: dropdowns del proyecto en libro/cap/vers', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Interlineal' }).first().click();

  await page.getByRole('button', { name: 'Cap.' }).click();
  await page.getByRole('option', { name: '2' }).first().click();
  await expect(page.getByText('Génesis 2:1').first()).toBeVisible({ timeout: 20000 });
});

test('ayudas de lectura aplican al instante sin recargar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Leer la Biblia' }).first().click();
  await expect(page.getByText('Agregar paralelo').first()).toBeVisible();

  // Sin biónica el markup existe pero sin efecto (peso normal)
  const bionic = page.locator('.passage-text .bionic-b').first();
  await expect(bionic).toBeVisible();
  expect(await bionic.evaluate((el) => getComputedStyle(el).fontWeight)).not.toBe('800');

  await page.getByRole('button', { name: 'Configuración' }).click();
  await page
    .locator('.font-card', { hasText: 'Lectura biónica' })
    .getByRole('button', { name: 'Leve', exact: true })
    .click();

  // Al instante: negrita biónica con peso 800, sin recargar ni navegar
  await expect(bionic).toBeVisible();
  expect(await bionic.evaluate((el) => getComputedStyle(el).fontWeight)).toBe('800');

  // Regla visible incluso con el modal abierto (z-index sobre el dialog)
  await page.locator('.font-card', { hasText: 'Regla de lectura' }).getByRole('button').click();
  await expect(page.locator('.reading-ruler')).toBeVisible();

  // Al desactivar, el efecto cesa al instante
  await page
    .locator('.font-card', { hasText: 'Lectura biónica' })
    .getByRole('button', { name: 'Off', exact: true })
    .click();
  expect(await bionic.evaluate((el) => getComputedStyle(el).fontWeight)).not.toBe('800');
});

test('helpers muestran estado activo inequívoco y TTS usa dropdowns del proyecto', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Leer la Biblia' }).first().click();
  await expect(page.getByText('Agregar paralelo').first()).toBeVisible();

  await page.getByRole('button', { name: 'Configuración' }).click();
  const bionicCard = page.locator('.font-card', { hasText: 'Lectura biónica' });
  await bionicCard.getByRole('button', { name: 'Fuerte', exact: true }).click();
  await expect(bionicCard.getByRole('button', { name: 'Fuerte', exact: true })).toHaveClass(/is-selected/);
  await expect(page.locator('body.bionic-fuerte')).toHaveCount(1);
  await bionicCard.getByRole('button', { name: 'Off', exact: true }).click();
  await expect(bionicCard.getByRole('button', { name: 'Off', exact: true })).toHaveClass(/is-selected/);
  await expect(page.locator('body.bionic-fuerte')).toHaveCount(0);
  await page.getByRole('button', { name: 'Listo' }).click();

  // Velocidad TTS con el dropdown neobrutalista (no <select> nativo)
  await expect(page.locator('.tts-rate-dropdown select')).toHaveCount(0);
  await page.getByRole('button', { name: 'Vel.' }).click();
  await page.getByRole('option', { name: '1.5x' }).click();
  await expect(page.getByRole('button', { name: 'Vel.' })).toContainText('1.5x');
});

test('palabras de Cristo tiñen dichos en Mateo', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Leer la Biblia' }).first().click();

  await page.getByPlaceholder(/Buscar pasaje/).fill('Mateo 5');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByText('Mateo 5').first()).toBeVisible({ timeout: 20000 });

  await page.getByRole('button', { name: 'Configuración' }).click();
  await page.locator('.font-card', { hasText: 'Palabras de Cristo' }).getByRole('button').click();
  await page.getByRole('button', { name: 'Listo' }).click();

  const red = page.locator('.words-of-christ').first();
  await expect(red).toBeVisible({ timeout: 20000 });
  expect(await red.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(185, 28, 28)');
});
