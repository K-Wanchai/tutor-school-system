const { chromium } = require('C:/Users/kakmi/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const { mkdirSync } = require('fs');

const OUT = './screenshots';
mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  // Login and navigate to dashboard
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[name="usernameOrEmail"]', 'admin@tutorschool.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('.auth-submit-btn');
  await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
  await page.waitForSelector('.admin-dashboard-page', { timeout: 10000 });
  // Wait for loading to finish
  await page.waitForFunction(() => !document.querySelector('.admin-dashboard-spinner'), { timeout: 10000 });

  await page.screenshot({ path: `${OUT}/v2-dashboard-desktop.png`, fullPage: true });
  console.log('✓ v2-dashboard-desktop');

  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.querySelector('.admin-dashboard-spinner'), { timeout: 8000 });
  await page.screenshot({ path: `${OUT}/v2-dashboard-tablet.png`, fullPage: true });
  console.log('✓ v2-dashboard-tablet');

  // Mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.querySelector('.admin-dashboard-spinner'), { timeout: 8000 });
  await page.screenshot({ path: `${OUT}/v2-dashboard-mobile.png`, fullPage: true });
  console.log('✓ v2-dashboard-mobile');

  if (errors.length) console.log('\n⚠ Console errors:', errors);
  else console.log('✓ No console errors');

  await browser.close();
})();
