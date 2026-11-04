export function getWallpaperHeaderLayout() {
  const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
  const statusHeight = Number(info.statusBarHeight) || 0
  const width = Number(info.windowWidth) || 375
  let top = statusHeight
  let rightInset = 16

  // #ifdef MP-WEIXIN
  if (typeof uni.getMenuButtonBoundingClientRect === 'function') {
    const capsule = uni.getMenuButtonBoundingClientRect()
    if (capsule && capsule.width > 0 && capsule.left > 0) {
      top = Math.max(statusHeight, capsule.top + (capsule.height - 44) / 2)
      rightInset = Math.max(16, width - capsule.left + 12)
    } else {
      top += 44
    }
  } else {
    top += 44
  }
  // #endif

  return { top: `${top}px`, rightInset: `${rightInset}px` }
}
