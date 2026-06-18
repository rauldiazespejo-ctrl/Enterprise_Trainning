import { chromium } from 'playwright';

(async () => {
  console.log("Starting script");
  const browser = await chromium.launch();
  console.log("Launched browser");
  const page = await browser.newPage();
  console.log("Created page");
  // Assuming the dev server is on port 5173
  await page.goto('http://localhost:5173');
  console.log("Navigated to localhost:5173");
  await page.screenshot({ path: 'frontend_screenshot.png' });
  console.log("Took screenshot");
  await browser.close();
  console.log("Closed browser");
})();
