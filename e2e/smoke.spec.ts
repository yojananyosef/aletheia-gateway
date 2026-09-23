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
