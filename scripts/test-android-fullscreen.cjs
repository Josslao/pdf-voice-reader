// 测试小米13 Pro 全面屏自适应
// 视口:1080 x 1440 (CSS 像素: 360 x 480 的设备)
// 小米13 Pro 实际 CSS 像素: 393 x 851 (6.36英寸 20:9,实际 1200x2670)
// 但状态栏在原生层渲染,浏览器中我们模拟 Android 全屏 viewport:393 x 851
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

// 小米13 Pro 实际 CSS 视口 + Android Chrome 模拟
const DEVICES = [
  // 小米13 Pro: 393x851,状态栏 ~24px,手势条 ~24px
  {
    name: "xiaomi13pro",
    width: 393,
    height: 851,
    dpr: 3,
    ua: "Mozilla/5.0 (Linux; Android 13; 2201122C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36",
  },
  // 模拟"应用全屏运行"——状态栏不占位的情况(模拟原生 APP 内 WebView)
  // 这时 CSS 兜底 8px 生效,Header 应该在顶部 8px 位置可见可点击
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
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
    await page.setUserAgent(device.ua);
    await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));

    // 给 <html> 加 android 类(模拟 main.tsx 在原生平台运行)
    await page.evaluate(() => {
      document.documentElement.classList.add("android");
    });
    await new Promise((r) => setTimeout(r, 500));

    // 截图 1:初始主界面
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `test-android-${device.name}-home.png`),
      fullPage: false,
    });

    // 测试设置按钮可点击性 + 位置
    const settingsBtn = await page.$(
      'button[aria-label="打开设置"]'
    );
    let btnBox = null;
    if (settingsBtn) {
      btnBox = await settingsBtn.boundingBox();
    }

    // 截图 2:点击设置按钮(测试点击)
    if (settingsBtn) {
      await settingsBtn.click();
      await new Promise((r) => setTimeout(r, 800));
    }
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `test-android-${device.name}-settings.png`),
      fullPage: false,
    });

    // 输出报告
    console.log(`\n=== ${device.name} (${device.width}x${device.height}) ===`);
    console.log(`Settings button box:`, btnBox);
    if (btnBox) {
      const safeMargin = 8; // 兜底值
      const statusOK = btnBox.y >= safeMargin;
      const clickableX = btnBox.x + btnBox.width <= device.width - safeMargin;
      const clickableY = btnBox.y + btnBox.height <= device.height - safeMargin;
      console.log(
        `按钮顶部 y=${Math.round(btnBox.y)}px, 安全边距 ≥${safeMargin}px → ${
          statusOK ? "✅ 在安全区" : "❌ 被状态栏遮挡"
        }`
      );
      console.log(
        `按钮右端 x=${Math.round(
          btnBox.x + btnBox.width
        )}px,屏幕宽 ${device.width}px → ${
          clickableX ? "✅ 不超界" : "❌ 超出右边界"
        }`
      );
      console.log(
        `按钮触控区 ${Math.round(btnBox.width)}x${Math.round(
          btnBox.height
        )}px → ${
          btnBox.width >= 44 && btnBox.height >= 44
            ? "✅ 满足 44pt 触控标准"
            : "⚠️ 触控区过小"
        }`
      );
    }

    // 关闭设置面板,测试二次点击
    if (settingsBtn) {
      // 先关闭
      await page.evaluate(() => {
        const overlay = document.querySelector('[aria-hidden="false"]');
        if (overlay) overlay.click();
      });
      await new Promise((r) => setTimeout(r, 500));
      // 再次点击设置按钮
      const btn2 = await page.$('button[aria-label="打开设置"]');
      if (btn2) {
        await btn2.click();
        await new Promise((r) => setTimeout(r, 800));
        const asideVisible = await page.evaluate(() => {
          const aside = document.querySelector("aside");
          if (!aside) return false;
          const rect = aside.getBoundingClientRect();
          return rect.top < window.innerHeight && rect.bottom > 0;
        });
        console.log(
          `设置面板可重复打开关闭: ${asideVisible ? "✅" : "❌"}`
        );
      }
    }

    await page.close();
  }

  await browser.close();
  console.log("\n✓ 测试完成");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
