import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(1000);

  // Fill the login form
  // Using the seeded admin from seed_auth.mjs
  await page.fill('input[type="email"]', 'admin@soldesp.cl');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);
  console.log("Logged in URL:", page.url());

  await page.goto('http://localhost:5173/super-admin');
  await page.waitForTimeout(3000);
  console.log("Super admin URL:", page.url());

  await page.screenshot({ path: 'frontend_screenshot_superadmin.png' });
  await browser.close();
})();
