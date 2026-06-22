const { chromium } = require('C:/Users/kakmi/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const networkErrors = [];
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('response', res => {
    if (res.url().includes('/auth/login')) {
      console.log('LOGIN RESPONSE:', res.status(), res.url());
      res.json().then(j => console.log('BODY:', JSON.stringify(j, null, 2))).catch(() => {});
    }
  });
  page.on('requestfailed', req => {
    if (req.url().includes('8080')) {
      networkErrors.push(`${req.method()} ${req.url()} → ${req.failure().errorText}`);
    }
  });

  // Detect which port Vite is on
  let port = 5173;
  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded', timeout: 4000 });
  } catch {
    port = 5174;
    await page.goto('http://localhost:5174/login', { waitUntil: 'domcontentloaded', timeout: 8000 });
  }
  console.log('Frontend port:', port);

  await page.waitForSelector('.auth-form-input', { timeout: 8000 });
  await page.fill('input[name="usernameOrEmail"]', 'admin@tutorschool.com');
  await page.fill('input[name="password"]', 'admin123');

  await page.screenshot({ path: './screenshots/login-filled.png' });
  console.log('Screenshot: login-filled');

  await page.click('.auth-submit-btn');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: './screenshots/login-after-submit.png' });
  console.log('Screenshot: login-after-submit');
  console.log('URL after submit:', page.url());

  if (networkErrors.length) console.log('\nNetwork errors:', networkErrors);
  if (consoleErrors.length) console.log('\nConsole errors:', consoleErrors);

  const errorEl = await page.$('.auth-error-alert');
  if (errorEl) {
    const text = await errorEl.innerText();
    console.log('\nUI error shown:', text);
  }

  await browser.close();
})();
