import { test, expect } from '@playwright/test';

// This test checks that the Agent Lee mic morphs and renders on the main UI

test.describe('Agent Lee Mic', () => {
  test('should render and morph through all forms', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout for hydration
    await page.goto('/');
    // Wait for the main app to be hydrated (LeewayWatermark is always present after hydration)
    // Try to find the mic root, or diagnose if stuck on permissions screen
    const micRoot = page.locator('[data-testid="agentlee-mic-root"]');
    const permissionsRoot = page.locator('[data-testid="permissions-loading-root"]');
    const found = await Promise.race([
      micRoot.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'mic'),
      permissionsRoot.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'permissions').catch(() => null)
    ]);
    if (found === 'permissions') {
      throw new Error('Test stuck on permissions loading screen — mic UI never rendered');
    }
    // Wait for the mic morph label to appear
    await expect(page.locator('[data-testid="mic-morph-label"]')).toBeVisible({ timeout: 20000 });
    // Check morph label cycles through all forms
    const forms = [
      'Eagle', 'Cat', 'Rabbit', 'Twins', 'BlockEagle', 'JetpackCat', 'Pagoda', 'CyberpunkCity', 'SakuraIsland'
    ];
    for (const form of forms) {
      await expect(page.locator('[data-testid="mic-morph-label"]')).toContainText(form);
      await page.waitForTimeout(2500); // Wait for morph to cycle
    }
  });
});
