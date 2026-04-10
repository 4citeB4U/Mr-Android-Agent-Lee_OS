import { test, expect } from '@playwright/test';

// This test checks that no shape selection buttons are present on the loading/initialization page

test('No shape selection buttons on loading page', async ({ page }) => {
  // Adjust the URL if your dev server runs on a different port
  await page.goto('http://localhost:3002/');

  // Wait for the main loading/initialization UI to appear
  await page.waitForSelector('body', { state: 'visible' });

  // Try to find any button that could be a shape selector
  // This selector should match the shape buttons if they exist
  const shapeButton = await page.$('button:text("cube"), button:text("sphere"), button:text("pyramid")');

  // Assert that no such button exists
  expect(shapeButton).toBeNull();
});
