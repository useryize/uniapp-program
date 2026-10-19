/**
 * @file 商城 mock 内存数据库
 *
 * 设计说明（对齐 docs/PRD-商城-v1.1-架构版.md）：
 * 1. 本层不是"假数据回显"，而是按 PRD 业务规则实现的「内存版服务端」——
 *    服务端计价、库存锁定/实扣、订单快照、幂等校验均在 handler 层落地。
 *    后期切换真实接口时只替换传输层（api/http.js），页面与业务规则零改动。
 * 2. 金额一律整数「分」存储与传输（PRD §9 设计要点 3），展示层经 utils/format.js 转元。
 * 3. 库存双字段模型（PRD §7.2）：
 *    - stock  可售库存：正常可下单
 *    - locked 锁定库存：已下单待付款（15 分钟内），支付后转实扣，超时释放
 * 4. 数据仅存运行期内存：小程序热重载/重启即重置（mock 的期望行为）。
 *    如联调时需要保持状态，可自行挂 uni.setStorageSync，默认保持纯净。
 */

import { MALL_CONFIG } from '../config'

/**
 * 订单状态枚举（对齐 PRD §6.2 履约流状态机）
 * 终态：FINISHED / CANCELED，不可逆；非法流转服务端必须拒绝
 * @enum {string}
 */
export const ORDER_STATUS = {
  UNPAID: 'UNPAID',     // 待付款
  PAID: 'PAID',         // 已支付（待发货）
  SHIPPED: 'SHIPPED',   // 已发货（待收货）
  FINISHED: 'FINISHED', // 已完成（终态）
  CANCELED: 'CANCELED'  // 已取消（终态）
}

/** 自增序号（模块内部使用） */
let seq = 1000

/**
 * 生成 mock 编号/ID
 * @param {string} prefix - 前缀：'NO'=订单号，'c'=购物车项，'a'=地址
 * @returns {string} 如 'NO1001'
 */
export function nextId(prefix) {
  return `${prefix}${++seq}`
}

/**
 * 商品 SPU 种子数据
 * @property {number}   id          商品 ID
 * @property {string}   title       标题
 * @property {number}   categoryId  类目：1 数码配件 / 2 家居生活 / 3 服饰箱包
 * @property {number}   originPrice 划线价（分），仅展示不可下单（PRD §①规则 2）
 * @property {number}   sales       销量
 * @property {string}   color       占位色块背景（mock 专用，真实接口无此字段）
 * @property {string}   description 一句话卖点
 * @property {number}   status      0 草稿 / 1 上架 / 2 下架（PRD §①）
 * @property {string}   cover       封面图（mock 恒空，接接口后走 CDN）
 */
const goodsSeed = [
  { id: 1, title: '无线降噪蓝牙耳机', categoryId: 1, originPrice: 29900, sales: 1523, color: '#378ADD', description: '主动降噪 · 40h 续航', status: 1 },
  { id: 2, title: '机械键盘 87键', categoryId: 1, originPrice: 39900, sales: 866, color: '#534AB7', description: '热插拔轴体 · 全键无冲', status: 1 },
  { id: 3, title: '智能保温杯 500ml', categoryId: 2, originPrice: 9900, sales: 3210, color: '#1D9E75', description: '316不锈钢 · 温度显屏', status: 1 },
  { id: 4, title: '香薰蜡烛礼盒', categoryId: 2, originPrice: 12800, sales: 542, color: '#D4537E', description: '大豆蜡 · 45h 燃烧', status: 1 },
  { id: 5, title: '纯棉T恤基础款', categoryId: 3, originPrice: 9900, sales: 8891, color: '#854F0B', description: '270g 重磅 · 不透不变形', status: 1 },
  { id: 6, title: '双肩背包 15.6寸', categoryId: 3, originPrice: 15900, sales: 1204, color: '#993C1D', description: '防泼水 · 独立电脑仓', status: 1 },
  { id: 7, title: '桌面加湿器', categoryId: 2, originPrice: 8900, sales: 2345, color: '#185FA5', description: '静音雾化 · 3L 大容量', status: 1 },
  { id: 8, title: '铝合金手机支架', categoryId: 1, originPrice: 4900, sales: 6720, color: '#5F5E5A', description: '可折叠 · 双轴调节', status: 1 }
]

/**
 * mock 数据库（单一数据源，所有 handler 共享读写）
 * @property {Array} goods     商品 SPU 列表
 * @property {Array} skus      SKU 列表（最小可售单位，PRD §①）
 * @property {Array} cart      购物车项（服务端存储，跨设备同步，PRD §5.5）
 * @property {Array} orders    订单列表（含快照，PRD §7.1 规则 3）
 * @property {Array} addresses 收货地址列表
 */
export const db = {
  goods: goodsSeed.map((g) => ({ ...g, cover: '' })),

  /**
   * SKU 由 SPU 派生：每个商品两个规格
   * @property {number} id     SKU ID（goodsId*10+n，保证稳定可被订单快照引用）
   * @property {number} stock  可售库存（分），条件扣减原子性见 order.create
   * @property {number} locked 锁定库存：下单转锁定，支付实扣，取消/超时释放
   */
  skus: goodsSeed.flatMap((g) => [
    { id: g.id * 10 + 1, goodsId: g.id, spec: '标准版', price: Math.round(g.originPrice * 0.6), stock: 50, locked: 0 },
    { id: g.id * 10 + 2, goodsId: g.id, spec: '升级版', price: Math.round(g.originPrice * 0.8), stock: 20, locked: 0 }
  ]),

  cart: [],

  orders: [],

  /** 预置地址（phone 按规范应密文存储，mock 阶段存明文+脱敏展示，见 PRD T5） */
  addresses: [
    { id: 1, receiver: '张三', phone: '13812348000', region: '天津市 和平区', detail: '南京路 100 号 3-501', isDefault: true },
    { id: 2, receiver: '李四', phone: '18687654321', region: '北京市 朝阳区', detail: '望京 SOHO T1 座 2201', isDefault: false }
  ]
}
