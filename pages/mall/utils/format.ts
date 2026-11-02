/**
 * 商城模块格式化工具
 * 金额规范：一律整数分存储与传输（PRD §9 设计要点 3），仅在展示层转元
 */

/** 分 -> 元字符串：1250 -> '12.50' */
export function fen2yuan(fen) {
  const n = Number(fen || 0)
  return (n / 100).toFixed(2)
}

/** 手机号脱敏：13812348000 -> 138****8000 */
export function maskedPhone(phone) {
  if (!phone || phone.length < 7) return phone || ''
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

/** 订单状态 -> 中文文案（对齐 PRD §6.2 状态机） */
export const ORDER_STATUS_TEXT = {
  UNPAID: '待付款',
  PAID: '待发货',
  SHIPPED: '待收货',
  FINISHED: '已完成',
  CANCELED: '已取消'
}

export function orderStatusText(status) {
  return ORDER_STATUS_TEXT[status] || status
}

/**
 * 时间戳 -> 'YYYY-MM-DD HH:mm'（订单时间轴展示用）
 * @param {number|null} ts 毫秒时间戳，空值返回 ''
 * @returns {string}
 */
export function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
