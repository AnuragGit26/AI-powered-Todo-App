import { test, expect } from '@playwright/test';


test('should navigate to the home page', async ({ page }) => {
  await page.goto('http://localhost:5175/');
  await expect(page).toHaveTitle('TaskMind AI');
});