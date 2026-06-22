const { chromium } = require('C:/Users/kakmi/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const { mkdirSync } = require('fs');

const BASE = 'http://localhost:5173';
const OUT  = './screenshots';
mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx     = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page    = await ctx.newPage();

  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  // 1. Login Page (desktop)
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.auth-login-page', { timeout: 15000 });
  await page.screenshot({ path: `${OUT}/01-login-desktop.png`, fullPage: false });
  console.log('✓ 01-login-desktop');

  // 2. Login Page (mobile)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/02-login-mobile.png`, fullPage: true });
  console.log('✓ 02-login-mobile');

  // 3. Register Page (desktop)
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.auth-register-page', { timeout: 10000 });
  await page.screenshot({ path: `${OUT}/03-register-desktop.png`, fullPage: true });
  console.log('✓ 03-register-desktop');

  // 4. Register Page (mobile)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/04-register-mobile.png`, fullPage: true });
  console.log('✓ 04-register-mobile');

  // 5. Unauthorized Page
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/unauthorized`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/05-unauthorized.png` });
  console.log('✓ 05-unauthorized');

  // 6. Admin Dashboard (desktop) — inject mock token to pass ProtectedRoute
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('token', 'mock-token-for-screenshot');
    localStorage.setItem('role',  'ADMIN');
  });
  await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.admin-dashboard-page', { timeout: 10000 });
  await page.screenshot({ path: `${OUT}/06-admin-dashboard-desktop.png`, fullPage: true });
  console.log('✓ 06-admin-dashboard-desktop');

  // 7. Admin Dashboard (tablet 768)
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/07-admin-dashboard-tablet.png`, fullPage: true });
  console.log('✓ 07-admin-dashboard-tablet');

  // 8. Admin Dashboard (mobile 390)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/08-admin-dashboard-mobile.png`, fullPage: true });
  console.log('✓ 08-admin-dashboard-mobile');

  if (errors.length) {
    console.log('\n⚠ Console errors:', errors.join('\n'));
  } else {
    console.log('✓ No console errors');
  }

  await browser.close();
  console.log('\nAll screenshots saved to ./screenshots/');
})();
