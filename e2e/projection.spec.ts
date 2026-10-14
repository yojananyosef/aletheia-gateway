import { expect, test, type Page } from '@playwright/test';

async function openReader(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Leer la Biblia' }).first().click();
  await expect(page.locator('.reader-card')).toBeVisible();
}

/**
 * Proyección en segunda pantalla.
 *
 * `serviceWorkers: 'block'` es parte del test y no un detalle: con el worker
 * activo las peticiones las hace el service worker y Playwright no las enruta,
 * así que el retardo de /projection no se aplicaba nunca y el caso lento pasaba
 * en verde sin comprobar nada. Es la trampa que dejó el módulo sin cobertura.
 */
test.describe('proyección en segunda pantalla', () => {
  test.use({ serviceWorkers: 'block' });

  /** Abre el visor retardando su documento `retardoMs` y devuelve la ventana. */
  async function proyectar(page: Page, retardoMs: number): Promise<Page> {
    await page.route('**/*', async (route) => {
      const req = route.request();
      if (req.resourceType() === 'document' && new URL(req.url()).pathname === '/projection') {
        await new Promise((r) => setTimeout(r, retardoMs));
      }
      await route.continue();
    });

    await openReader(page);
    const ventana = page.waitForEvent('popup');
    await page.locator('.reader-toolbar button[aria-label*="Proyectar"]').first().click();
    const popup = await ventana;
    await popup.waitForLoadState('domcontentloaded');
    return popup;
  }

  for (const retardo of [0, 3000]) {
    test(`el visor recibe el pasaje aunque cargue ${retardo} ms después del clic`, async ({ page }) => {
      const popup = await proyectar(page, retardo);
      // Lo que salva el caso lento es el handshake `ready`: los reintentos con
      // reloj se agotaban a los ~1,2 s y el mensaje se perdía para siempre.
      await expect(popup.locator('.projection-text')).toBeVisible({ timeout: 20000 });
      await expect(popup.locator('.projection-ref')).toContainText('RV');
    });
  }

  test('detener la proyección vacía el visor y no lo revive después', async ({ page }) => {
    const popup = await proyectar(page, 0);
    await expect(popup.locator('.projection-text')).toBeVisible({ timeout: 20000 });

    await page.locator('.reader-toolbar button[aria-label="Detener proyección"]').click();
    await expect(popup.locator('.projection-idle')).toBeVisible({ timeout: 10000 });

    // Sin cancelar los temporizadores de reintento, el de 2,5 s volvía a
    // proyectar el pasaje que el usuario acababa de apagar.
    await page.waitForTimeout(4000);
    await expect(popup.locator('.projection-text')).toHaveCount(0);
    await expect(popup.locator('.projection-idle')).toBeVisible();
  });

  test('reproyectar tras apagar vuelve a llenar el visor', async ({ page }) => {
    const popup = await proyectar(page, 0);
    await expect(popup.locator('.projection-text')).toBeVisible({ timeout: 20000 });

    await page.locator('.reader-toolbar button[aria-label="Detener proyección"]').click();
    await expect(popup.locator('.projection-idle')).toBeVisible({ timeout: 10000 });

    // `window.open` reutiliza la ventana con nombre: no se abre una segunda.
    await page.locator('.reader-toolbar button[aria-label="Proyectar capítulo"]').click();
    await expect(popup.locator('.projection-text')).toBeVisible({ timeout: 20000 });
  });

  test('/projection se sirve como visor y no como el shell de la app', async ({ page }) => {
    const respuesta = await page.request.get('/projection');
    expect(respuesta.ok()).toBe(true);
    const html = await respuesta.text();
    expect(html).toContain('AletheiaGateway');
    // El shell de la SPA lleva la navegación lateral; el visor no.
    expect(html).not.toContain('neo-sidebar');
  });
});
