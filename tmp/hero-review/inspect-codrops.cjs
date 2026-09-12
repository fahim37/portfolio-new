const { chromium } = require(require('path').join(process.env.TEMP, 'brightedge-playwright/node_modules/playwright-core'));

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('https://tympanus.net/Development/Scroll3DGrid/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.screenshot({ path: 'tmp/hero-review/codrops-reference-start.png' });
    for (const y of [700, 1400, 2100, 2800]) {
      await page.evaluate(target => scrollTo(0, target), y);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `tmp/hero-review/codrops-reference-${y}.png` });
    }
    console.log(await page.locator('body').innerText());
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
