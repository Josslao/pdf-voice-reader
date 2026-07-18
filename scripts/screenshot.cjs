// 截图脚本:用 puppeteer-core 调用本地 Chrome 截图工作界面
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

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--window-size=1440,900",
    ],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 });

  // 等待首屏稳定
  await new Promise((r) => setTimeout(r, 1500));

  // 1) 主界面
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "home.png"),
    fullPage: false,
  });
  console.log("✓ home.png saved");

  // 2) 设置面板:点击设置按钮
  try {
    // 找到设置按钮(齿轮图标)。先尝试 aria-label
    const settingsBtn = await page.$(
      'button[aria-label*="设置"], button[aria-label*="Settings"], button[title*="设置"]'
    );
    if (settingsBtn) {
      await settingsBtn.click();
    } else {
      // 回退:找 Header 右上角最后一个按钮
      const buttons = await page.$$("header button, header [role=button]");
      if (buttons.length > 0) {
        await buttons[buttons.length - 1].click();
      }
    }
    await new Promise((r) => setTimeout(r, 800));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "settings.png"),
      fullPage: false,
    });
    console.log("✓ settings.png saved");
  } catch (e) {
    console.warn("设置面板截图失败:", e.message);
  }

  await browser.close();
})().catch((e) => {
  console.error("截图失败:", e);
  process.exit(1);
});
