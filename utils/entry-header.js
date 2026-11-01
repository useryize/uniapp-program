// 入口页的内容栏放在系统状态栏和小程序胶囊下方。
export const getEntryHeaderInset = () => {
  const info = uni.getSystemInfoSync()
  let inset = Number(info.statusBarHeight) || 0

  // #ifdef MP-WEIXIN
  // 胶囊不可用时，仍为微信原生导航区域保留 44px。
  inset += 44
  if (typeof uni.getMenuButtonBoundingClientRect === 'function') {
    const capsule = uni.getMenuButtonBoundingClientRect()
    if (capsule && capsule.height > 0 && capsule.bottom > 0) {
      inset = Math.max(inset, capsule.bottom + 8)
    }
  }
  // #endif

  return `${inset}px`
}
