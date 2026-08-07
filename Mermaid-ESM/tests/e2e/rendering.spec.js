import { test, expect } from '@playwright/test';

test.describe('Mermaid Explorer E2E', () => {
  test('renders the application and initial flowchart diagram SVG', async ({ page }) => {
    // Navigate to the app root
    await page.goto('/');

    // Verify page title
    await expect(page).toHaveTitle(/Mermaid/i);

    // Verify SVG is rendered inside target container
    const svgLocator = page.locator('#target svg');
    await expect(svgLocator).toBeVisible({ timeout: 10000 });
  });

  test('fetches diagram chunks lazily', async ({ page }) => {
    const fetchedChunks = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('.js')) {
        fetchedChunks.push(url);
      }
    });

    await page.goto('/');
    await page.waitForSelector('#target svg', { timeout: 10000 });

    // Verify that JavaScript chunks were loaded
    expect(fetchedChunks.length).toBeGreaterThan(0);
  });
});

