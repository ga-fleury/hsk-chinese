/**
 * Renders the app icon set from icon.html with headless Chromium.
 * The mark is 汉 (hàn) in cream on cinnabar, styled after a Chinese seal.
 *
 *   npm i --no-save playwright-core
 *   node scripts/icons/render.js
 *
 * Outputs into assets/ and public/. playwright-core is a one-off dev
 * dependency, deliberately not in package.json. Also requires a CJK font
 * (WenQuanYi Zen Hei) and Chromium — override its path with CHROMIUM_PATH.
 */
const { chromium } = require('playwright-core');
const path = require('path');

const HERE = __dirname;
const ROOT = path.resolve(HERE, '../..');
const CHROME = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';

// [mode, output path relative to repo root, pixel size, transparent background]
const JOBS = [
  ['icon', 'assets/icon.png', 1024, false],
  ['foreground', 'assets/android-icon-foreground.png', 1024, true],
  ['monochrome', 'assets/android-icon-monochrome.png', 1024, true],
  ['background', 'assets/android-icon-background.png', 1024, false],
  ['splash', 'assets/splash-icon.png', 1024, true],
  ['icon', 'assets/favicon.png', 196, false],
  ['icon', 'public/icon.png', 1024, false],
  ['maskable', 'public/icon-maskable.png', 1024, false],
];

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [mode, out, size, transparent] of JOBS) {
    const page = await (await browser.newContext({
      viewport: { width: 1024, height: 1024 },
      deviceScaleFactor: size / 1024,
    })).newPage();
    await page.goto(`file://${HERE}/icon.html?mode=${mode}`);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(ROOT, out), omitBackground: transparent });
    await page.close();
    console.log('rendered', out, `${size}px`);
  }
  await browser.close();
})();
