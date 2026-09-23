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
