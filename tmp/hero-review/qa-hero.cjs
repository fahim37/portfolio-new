/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const assert = require('node:assert/strict');
const { chromium } = require(path.join(process.env.TEMP, 'brightedge-playwright', 'node_modules', 'playwright-core'));

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const results = [];
  try {
    for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844], ['small-mobile', 320, 568], ['tablet', 820, 1180], ['landscape', 844, 390]]) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 768, hasTouch: width < 900 });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      await page.waitForFunction(() => document.querySelector('[data-signal-hero]').dataset.videoReady === 'true');
      const hero = page.locator('[data-signal-hero]');
      const geometry = await hero.evaluate(el => {
        const stage = el.firstElementChild;
        const padding = parseFloat(getComputedStyle(el).paddingTop);
        return { travel: el.offsetHeight - padding - stage.offsetHeight, overflow: document.documentElement.scrollWidth - innerWidth, initialTime: el.querySelector('video').currentTime, stageBottom: stage.getBoundingClientRect().bottom, stageHeight: stage.offsetHeight };
      });
      assert.equal(geometry.overflow, 0, name + ' horizontal overflow');
      assert.ok(geometry.initialTime < 0.05, name + ' starts at zero');
      assert.ok(geometry.stageBottom <= height + 1, name + ' stage fits viewport');
      const work = hero.getByRole('link', { name: 'Explore my work' });
      const workBox = await work.boundingBox();
      assert.ok(workBox.y + workBox.height < height, name + ' work link visible');
      await page.screenshot({ path: path.join(__dirname, name + '-start.png') });
      const samples = [];
      for (const progress of [0.5, 0.95, 0.2, 0]) {
        await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), geometry.travel * progress);
        await page.waitForFunction(expected => {
          const v = document.querySelector('[data-signal-hero] video');
          return !v.seeking && Math.abs(v.currentTime - expected * (v.duration - 1 / 24)) < 0.12;
        }, progress);
        const state = await hero.evaluate(el => ({ time: el.querySelector('video').currentTime, paused: el.querySelector('video').paused, top: el.firstElementChild.getBoundingClientRect().top, chapter: el.dataset.chapter }));
        assert.ok(state.paused, name + ' video must not autoplay');
        assert.ok(Math.abs(state.top - (width < 768 ? 64 : 0)) < 2, name + ' sticky stage');
        samples.push(state);
        if (progress === 0.95) await page.screenshot({ path: path.join(__dirname, name + '-end.png') });
      }
      // A rapid burst must settle on the most recent target, including reverse movement.
      for (const p of [0.8, 0.1, 0.9, 0.4]) {
        await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), geometry.travel * p);
        await page.waitForTimeout(20);
      }
      await page.waitForFunction(() => { const v = document.querySelector('[data-signal-hero] video'); return !v.seeking && Math.abs(v.currentTime - (v.duration - 1 / 24) * 0.4) < 0.12; });
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await work.click();
      await page.waitForFunction(() => location.hash === '#projects');
      assert.equal(errors.length, 0, errors.join('\n'));
      results.push({ name, geometry, samples, errors });
      await context.close();
    }
    const reduced = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', isMobile: true });
    const page = await reduced.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    const staticState = await page.locator('[data-signal-hero]').evaluate(el => ({ height: el.offsetHeight, src: el.querySelector('video').getAttribute('src'), position: getComputedStyle(el.firstElementChild).position }));
    assert.equal(staticState.src, null);
    assert.equal(staticState.position, 'relative');
    assert.ok(staticState.height <= 845);
    await page.screenshot({ path: path.join(__dirname, 'reduced-motion.png') });
    results.push({ reducedMotion: staticState });
    await reduced.close();
    const fallback = await browser.newContext();
    const fallbackPage = await fallback.newPage();
    await fallbackPage.route('**/herovid/*.mp4', route => route.abort());
    await fallbackPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await fallbackPage.getByRole('heading', { name: 'Beyond the interface.' }).waitFor();
    assert.equal(await fallbackPage.locator('[data-signal-hero]').getAttribute('data-video-ready'), 'false');
    results.push({ failedVideoFallback: 'poster and headline remain available' });
    await fallback.close();
    console.log(JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
