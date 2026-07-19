import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Keyboard, KeyboardResize } from '@capacitor/keyboard'
import App from './App'
import './index.css'

// 检测平台并给 <html> 加 class,用于 CSS 兜底安全区
function detectPlatform() {
  const platform = Capacitor.getPlatform()
  if (platform === 'android') {
    document.documentElement.classList.add('android')
  } else if (platform === 'ios') {
    document.documentElement.classList.add('ios')
  }
}

// 移动端初始化:状态栏样式 + 安全区注入 + 键盘自适应
async function initMobile() {
  detectPlatform()

  // 浏览器开发模式:跳过原生插件调用
  if (!Capacitor.isNativePlatform()) {
    return
  }

  try {
    // 关键:overlay=false → Android 状态栏让出空间,WebView 从状态栏下方开始绘制
    // 这样 Header 不会被状态栏遮挡,无需再靠 padding-top 撑开
    await StatusBar.setOverlaysWebView({ overlay: false })
    // 状态栏文字色:浅色背景配深色文字
    await StatusBar.setStyle({ style: Style.Light })
    // 状态栏背景色与 Header 毛玻璃色协调
    await StatusBar.setBackgroundColor({ color: '#ffffff' })
  } catch (e) {
    console.warn('StatusBar init failed:', e)
  }

  try {
    // 键盘弹出时调整布局(让输入框可见)
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body })
  } catch (e) {
    console.warn('Keyboard init failed:', e)
  }
}

void initMobile()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
