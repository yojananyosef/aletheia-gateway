import { expect, test } from '@playwright/test';

test.describe('cargas de pasajes', () => {
  test.use({ serviceWorkers: 'block' });

  test('una respuesta anterior no reemplaza un pasaje más reciente', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('aletheia_selected_translations', JSON.stringify(['RV1909']));
    });

    let releaseOld!: () => void;
    let markStarted!: () => void;
    let markFinished!: () => void;
    const gate = new Promise<void>((resolve) => { releaseOld = resolve; });
    const started = new Promise<void>((resolve) => { markStarted = resolve; });
    const finished = new Promise<void>((resolve) => { markFinished = resolve; });
    await page.route('**/data/bibles/RV1909/GEN.json*', async (route) => {
      const response = await route.fetch();
      markStarted();
      await gate;
      await route.fulfill({ response });
      markFinished();
    });

    try {
      await page.goto('/');
      await started;
      await page.getByRole('button', { name: 'Leer la Biblia' }).first().click();
      const search = page.getByRole('textbox', { name: 'Buscar pasaje bíblico' });
      await search.fill('Éxodo 1');
      await search.press('Enter');
      await expect(page.locator('.passage-text[data-book="Éxodo"]').first()).toBeVisible({ timeout: 20000 });

      releaseOld();
      await finished;
      // Permite que se procesen la respuesta anterior y las actualizaciones de Svelte.
      await page.waitForTimeout(500);
      await expect(page.locator('.passage-text[data-book="Éxodo"]').first()).toBeVisible();
      await expect(page.locator('.passage-text[data-book="Génesis"]')).toHaveCount(0);
    } finally {
      releaseOld();
    }
  });
});
