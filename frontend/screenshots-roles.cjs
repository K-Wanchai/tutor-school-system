const { chromium } = require('C:/Users/kakmi/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const { mkdirSync } = require('fs');

const OUT = './screenshots';
mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  // ── Admin ──
  const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminCtx.newPage();
  await adminPage.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await adminPage.fill('input[name="usernameOrEmail"]', 'admin@tutorschool.com');
  await adminPage.fill('input[name="password"]', 'admin123');
  await adminPage.click('.auth-submit-btn');
  await adminPage.waitForURL('**/admin/dashboard', { timeout: 10000 });
  await adminPage.waitForFunction(() => !document.querySelector('.admin-dashboard-spinner'), { timeout: 8000 });
  await adminPage.screenshot({ path: `${OUT}/role-admin-dashboard.png`, fullPage: false });
  console.log('✓ Admin dashboard');
  await adminCtx.close();

  // ── Tutor (inject token) ──
  const tutorCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const tutorPage = await tutorCtx.newPage();
  await tutorPage.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await tutorPage.evaluate(() => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('role', 'TUTOR');
    localStorage.setItem('username', 'tutor@example.com');
  });
  await tutorPage.goto('http://localhost:5173/tutor/dashboard', { waitUntil: 'networkidle' });
  await tutorPage.waitForSelector('.tutor-dashboard-page', { timeout: 8000 });
  await tutorPage.screenshot({ path: `${OUT}/role-tutor-dashboard.png`, fullPage: false });
  console.log('✓ Tutor dashboard');
  await tutorCtx.close();

  // ── Student (inject token) ──
  const stuCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const stuPage = await stuCtx.newPage();
  await stuPage.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await stuPage.evaluate(() => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('role', 'STUDENT');
    localStorage.setItem('username', 'student@example.com');
  });
  await stuPage.goto('http://localhost:5173/student/dashboard', { waitUntil: 'networkidle' });
  await stuPage.waitForSelector('.student-dashboard-page', { timeout: 8000 });
  await stuPage.screenshot({ path: `${OUT}/role-student-dashboard.png`, fullPage: false });
  console.log('✓ Student dashboard');
  await stuCtx.close();

  await browser.close();
  console.log('\nAll role screenshots done.');
})();
