import { expect, test } from '@playwright/test';

test.describe('navegación interlineal durante la carga', () => {
  test.use({ serviceWorkers: 'block' });

  test('los botones esperan al nuevo capítulo antes de permitir otra navegación', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('aletheia_interlinear_position', JSON.stringify({ book: 'Génesis', chapter: 50, verse: 26 }));
    });

    let release!: () => void;
    let markStarted!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const started = new Promise<void>((resolve) => { markStarted = resolve; });
    await page.route('**/data/bibles/SpaPlatense/EXO.json*', async (route) => {
      const response = await route.fetch();
      markStarted();
      await gate;
      await route.fulfill({ response });
    });

    try {
      await page.goto('/');
      await page.getByRole('button', { name: 'Interlineal' }).first().click();
      await expect(page.locator('.interlinear-titles span')).toHaveText('Génesis 50:26');
      await page.getByRole('button', { name: 'Siguiente' }).click();
      await started;
      await expect(page.locator('.interlinear-titles span')).toHaveText('Éxodo 1:1');
      await expect(page.getByRole('button', { name: 'Anterior' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Siguiente' })).toBeDisabled();

      release();
      await page.getByRole('button', { name: 'Anterior' }).click();
      await expect(page.locator('.interlinear-titles span')).toHaveText('Génesis 50:26');
    } finally {
      release();
    }
  });
});
