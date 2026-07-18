// 移动端 viewport 截图脚本:iPhone 15 Pro (393x852) 与 Android Pixel 7 (412x915)
const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const SCREENSHOT_DIR = path.join(__dirname, "screenshots");
const CHROME_PATH =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = "http://localhost:5173/";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const DEVICES = [
  { name: "iphone15pro", width: 393, height: 852, dpr: 3, ua: "iPhone" },
  { name: "pixel7", width: 412, height: 915, dpr: 2.625, ua: "Pixel" },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
  });

  for (const device of DEVICES) {
    const page = await browser.newPage();
    await page.setViewport({
      width: device.width,
      height: device.height,
      deviceScaleFactor: device.dpr,
      isMobile: true,
      hasTouch: true,
    });
    await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `mobile-${device.name}-home.png`),
      fullPage: false,
    });
    console.log(`✓ ${device.name} home saved`);

    // 打开设置抽屉
    try {
      const btn = await page.$(
        'button[aria-label*="设置"], button[aria-label*="Settings"]'
      );
      if (btn) {
        await btn.click();
        await new Promise((r) => setTimeout(r, 800));
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `mobile-${device.name}-settings.png`),
          fullPage: false,
        });
        console.log(`✓ ${device.name} settings saved`);
      }
    } catch (e) {
      console.warn(`${device.name} settings 失败:`, e.message);
    }

    await page.close();
  }

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
