// 将天气页的自定义导航与微信原生胶囊排在同一行。
export const getWeatherHeaderLayout = () => {
  const info = uni.getSystemInfoSync()
  const statusHeight = Number(info.statusBarHeight) || 0
  const windowWidth = Number(info.windowWidth) || 375
  const rowHeight = 44
  let top = statusHeight
  let rightInset = 16

  // #ifdef MP-WEIXIN
  if (typeof uni.getMenuButtonBoundingClientRect === 'function') {
    const capsule = uni.getMenuButtonBoundingClientRect()
    if (capsule && capsule.width > 0 && capsule.height > 0 && capsule.left > 0) {
      top = Math.max(statusHeight, capsule.top + (capsule.height - rowHeight) / 2)
      rightInset = Math.max(16, windowWidth - capsule.left + 12)
    } else {
      top += rowHeight
    }
  } else {
    top += rowHeight
  }
  // #endif

  return {
    top: `${top}px`,
    rightInset: `${rightInset}px`,
    homeRightInset: `${Math.max(0, rightInset - 20)}px`,
    totalHeight: `${top + rowHeight}px`
  }
}
