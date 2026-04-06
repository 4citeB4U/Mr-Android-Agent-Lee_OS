import { test, expect } from '@playwright/test';

// This test checks that Agent Lee's voice/RTC pipeline is connectable and responsive

test('Agent Lee voice/RTC pipeline responds', async ({ page }) => {
  await page.goto('http://localhost:3002/');

  // Wait for the Agent Lee UI to load
  await page.waitForSelector('body', { state: 'visible' });

  // Simulate clicking the microphone or voice activation button if present
  // (Update selector as needed for your UI)
  const micButton = await page.$('button[aria-label*="mic"], button[title*="mic"], button:has-text("Speak")');
  if (micButton) {
    await micButton.click();
  }

  // Simulate sending a text input if voice is not available
  const input = await page.$('input, textarea');
  if (input) {
    await input.type('Hello Agent Lee, are you online?');
    await input.press('Enter');
  }

  // Wait for a response in the chat area (span.whitespace-pre-wrap is used in ChatConsole)
  const response = await page.waitForSelector('span.whitespace-pre-wrap', { timeout: 15000 });
  expect(response).not.toBeNull();
  const text = await response.textContent();
  expect(text?.toLowerCase()).toContain('lee'); // Should mention Agent Lee or similar
});
