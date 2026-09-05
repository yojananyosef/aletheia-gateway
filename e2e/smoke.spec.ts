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
