import { expect, test, type Page } from '@playwright/test';

/**
 * The Phase-1 conversion path. If this breaks, the business stops receiving
 * leads, so it is the one flow covered end to end.
 */

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function fillLocationStep(page: Page) {
  await page.fill('#address', '145 rue des Érables');
  await page.fill('#city', 'Brossard');
  await page.fill('#postalCode', 'J4W 2K3');
  await page.getByRole('button', { name: 'Continuer' }).click();
}

async function fillProjectStep(page: Page) {
  await page.locator('#projectType-FOUNDATION').check();
  await page.fill('#estimatedVolumeM3', '6');
  await page.locator('#concreteStrength-MPA_30').check();
  await page.locator('#pumpRequired-YES').check();
  await page.getByRole('button', { name: 'Continuer' }).click();
}

async function fillScheduleStep(page: Page) {
  await page.fill('#desiredDate', daysFromNow(14));
  await page.selectOption('#preferredTime', 'MORNING');
  await page.getByRole('button', { name: 'Continuer' }).click();
}

async function fillContactStep(page: Page) {
  await page.locator('#customerType-BUSINESS').check();
  await page.fill('#name', 'Martin Tremblay');
  await page.fill('#companyName', 'Excavation Tremblay inc.');
  await page.fill('#phone', '(450) 555-0142');
  await page.fill('#email', 'e2e@example.com');
  await page.locator('#preferredContactMethod-PHONE').check();
  await page.locator('#consent').check();
}

test('a visitor can go from the home page to a submitted request', async ({ page }) => {
  await page.goto('/fr?utm_source=e2e&utm_medium=test&utm_campaign=phase1');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Besoin de béton? On s’en occupe.',
  );

  await page.getByRole('link', { name: 'Obtenir une soumission' }).first().click();
  await expect(page).toHaveURL(/\/fr\/soumission$/);

  await fillLocationStep(page);
  await fillProjectStep(page);
  await fillScheduleStep(page);
  await fillContactStep(page);

  await page.getByRole('button', { name: 'Envoyer ma demande' }).click();

  // Confirmation must say the request was received — never that anything is booked.
  await expect(page.getByRole('heading', { name: 'Demande reçue' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText(/^BD-\d{6}$/)).toBeVisible();
  await expect(page.getByText(/n’est pas une réservation|non une réservation/)).toBeVisible();
});

test('the form refuses to advance while a required field is missing', async ({ page }) => {
  await page.goto('/fr/soumission');

  await page.getByRole('button', { name: 'Continuer' }).click();

  // Scoped to the form: Next renders its own role="alert" route announcer.
  await expect(page.locator('form [role="alert"]')).toContainText('Veuillez corriger');
  await expect(
    page.getByText('Indiquez l’adresse ou l’emplacement du chantier.').first(),
  ).toBeVisible();
  // Still on step 1.
  await expect(page.getByRole('heading', { name: 'Où se déroule le projet?' })).toBeVisible();
});

test('an invalid postal code is rejected with a usable message', async ({ page }) => {
  await page.goto('/fr/soumission');

  await page.fill('#address', '145 rue des Érables');
  await page.fill('#city', 'Brossard');
  await page.fill('#postalCode', '12345');
  await page.getByRole('button', { name: 'Continuer' }).click();

  // The message appears twice on purpose: once in the error summary at the top
  // of the step and once beside the field itself.
  await expect(page.getByText(/code postal canadien valide/)).toHaveCount(2);
  await expect(page.locator('#postalCode-error')).toBeVisible();
});

test('"I don\'t know" replaces the volume instead of blocking the request', async ({ page }) => {
  await page.goto('/fr/soumission');

  await fillLocationStep(page);

  await page.locator('#projectType-GARAGE').check();
  await page.locator('#volumeUnknown').check();
  await expect(page.locator('#estimatedVolumeM3')).toBeDisabled();

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(
    page.getByRole('heading', { name: 'Quand avez-vous besoin du béton?' }),
  ).toBeVisible();
});

test('the English form reaches the same confirmation', async ({ page }) => {
  await page.goto('/en/quote');

  await page.fill('#address', '2200 boulevard Industriel');
  await page.fill('#city', 'Longueuil');
  await page.fill('#postalCode', 'J4G 1P1');
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.locator('#projectType-COMMERCIAL').check();
  await page.fill('#estimatedVolumeM3', '10');
  await page.locator('#concreteStrength-MPA_35').check();
  await page.locator('#pumpRequired-NO').check();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.fill('#desiredDate', daysFromNow(21));
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.locator('#customerType-INDIVIDUAL').check();
  await page.fill('#name', 'Peter Nolan');
  await page.fill('#phone', '450-555-0170');
  await page.fill('#email', 'e2e-en@example.com');
  await page.locator('#consent').check();
  await page.getByRole('button', { name: 'Send my request' }).click();

  await expect(page.getByRole('heading', { name: 'Request received' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText(/^BD-\d{6}$/)).toBeVisible();
});
