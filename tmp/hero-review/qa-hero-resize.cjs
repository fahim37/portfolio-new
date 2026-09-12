/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const assert = require('node:assert/strict');
const { chromium } = require(path.join(process.env.TEMP, 'brightedge-playwright', 'node_modules', 'playwright-core'));
(async () => {
 const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
 try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('[data-signal-hero] video').readyState >= 2);
  await page.locator('.rail .theme-toggle').click();
  assert.equal(await page.locator('[data-signal-hero]').evaluate(el => getComputedStyle(el).color), 'rgb(248, 246, 241)');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => { const v = document.querySelector('[data-signal-hero] video'); return v.currentSrc.includes('hero-mobile') && v.readyState >= 2; });
  await page.evaluate(() => scrollTo({ top: 600, behavior: 'instant' }));
  await page.waitForFunction(() => document.querySelector('[data-signal-hero] video').currentTime > 3);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => !document.querySelector('[data-signal-hero] video').getAttribute('src'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => document.querySelector('[data-signal-hero] video').readyState >= 2);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForFunction(() => { const v = document.querySelector('[data-signal-hero] video'); return v.currentSrc.includes('hero-desktop') && v.readyState >= 2 && !v.seeking && v.currentTime < .1; });
  await page.screenshot({ path: path.join(__dirname, 'landscape-final.png') });
  const menu = await page.locator('.rail .menu-toggle').boundingBox();
  assert.equal(menu.height, 46);
  await page.locator('.rail .menu-toggle').click();
  assert.equal(await page.locator('.rail .menu-toggle').getAttribute('aria-expanded'), 'true');
  console.log('PASS: theme, breakpoint video selection, dynamic reduced motion, restored scrubbing, landscape navigation');
 } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
