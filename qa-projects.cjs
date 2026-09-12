const path = require("path");
const { chromium } = require(path.join(process.env.TEMP, "brightedge-playwright", "node_modules", "playwright-core"));

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => message.type() === "error" && errors.push(`console: ${message.text()}`));
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  await page.goto("http://127.0.0.1:3100", { waitUntil: "networkidle" });

  const cards = page.locator("[data-stack-card]");
  const cardCount = await cards.count();
  const positions = await cards.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top + scrollY, height: rect.height, title: element.querySelector("h3")?.textContent };
  }));
  const dummyLinks = await cards.evaluateAll((elements) => elements.slice(2).map((element) => ({
    href: element.getAttribute("href"),
    target: element.getAttribute("target"),
    cursor: element.getAttribute("data-cursor"),
    label: element.querySelector(".project-link")?.textContent?.trim(),
  })));

  const samples = [];
  for (let index = 2; index < positions.length; index += 1) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), positions[index].top - 215);
    await page.waitForTimeout(1050);
    const state = await cards.nth(index).evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { top: Math.round(rect.top), bottom: Math.round(rect.bottom), opacity: getComputedStyle(element).opacity };
    });
    samples.push(state);
    await page.screenshot({ path: path.join(process.env.TEMP, `portfolio-concept-${index + 1}-light.png`), fullPage: false });
  }

  await page.locator(".rail .theme-toggle").click();
  await page.waitForTimeout(450);
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), positions[3].top - 215);
  await page.waitForTimeout(650);
  await page.screenshot({ path: path.join(process.env.TEMP, "portfolio-concept-dark.png"), fullPage: false });

  const desktopState = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    bodyHeight: document.body.scrollHeight,
    theme: document.documentElement.dataset.theme,
    stack: Array.from(document.querySelectorAll("[data-stack-card]")).map((element) => {
      const rect = element.getBoundingClientRect();
      return { top: Math.round(rect.top), zIndex: getComputedStyle(element).zIndex };
    }),
  }));

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, colorScheme: "dark" });
  const mobilePage = await mobile.newPage();
  const mobileErrors = [];
  mobilePage.on("console", (message) => message.type() === "error" && mobileErrors.push(`console: ${message.text()}`));
  mobilePage.on("pageerror", (error) => mobileErrors.push(`page: ${error.message}`));
  await mobilePage.goto("http://127.0.0.1:3100", { waitUntil: "networkidle" });
  const mobilePosition = await mobilePage.locator("[data-stack-card]").nth(2).evaluate((element) => element.getBoundingClientRect().top + scrollY);
  await mobilePage.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), mobilePosition - 145);
  await mobilePage.waitForTimeout(1000);
  const mobileState = await mobilePage.evaluate(() => ({
    cards: document.querySelectorAll("[data-stack-card]").length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    bodyHeight: document.body.scrollHeight,
    thirdCard: document.querySelectorAll("[data-stack-card]")[2].getBoundingClientRect().toJSON(),
    cardHeights: Array.from(document.querySelectorAll("[data-stack-card]")).map((element) => ({
      title: element.querySelector("h3")?.textContent,
      height: element.getBoundingClientRect().height,
    })),
  }));
  await mobilePage.screenshot({ path: path.join(process.env.TEMP, "portfolio-concept-mobile.png"), fullPage: false });

  console.log(JSON.stringify({ cardCount, positions, dummyLinks, samples, desktopState, mobileState, errors, mobileErrors }, null, 2));
  await mobile.close();
  await context.close();
  await browser.close();
})();
