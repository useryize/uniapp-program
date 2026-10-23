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
 *    如需联调时保持状态，可自行挂 uni.setStorageSync，默认保持纯净。
 *
 * 【服装电商改造 · 2026-10-23】
 * 相对通用商城版本，模型做了三处扩展，支撑「尺码决策 + 发售机制」双主线：
 *   - SPU 增加 colors（颜色维度）/ sizes（尺码维度）/ sizeChart（尺码表）
 *   - SKU 由「SPU × 颜色 × 尺码」笛卡尔积派生，id = goodsId*1000 + 色序*100 + 码序
 *   - 增加 drops（发售日历），承载限量款「即将发售/正在发售/已售罄」三态
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
 * 类目树（服装）：一级类目 → 二级类目
 * 分类页左侧栏渲染一级类目，右侧商品网格按当前一级类目过滤
 */
export const CATEGORIES = [
  { id: 0, name: '全部', icon: 'grid' },
  { id: 10, name: '上装', icon: 'tee', children: [{ id: 11, name: '卫衣' }, { id: 12, name: 'T恤' }, { id: 13, name: '衬衫' }] },
  { id: 20, name: '下装', icon: 'pants', children: [{ id: 21, name: '工装裤' }, { id: 22, name: '牛仔裤' }] },
  { id: 30, name: '外套', icon: 'coat', children: [{ id: 31, name: '牛仔外套' }, { id: 32, name: '教练夹克' }] },
  { id: 40, name: '鞋履', icon: 'shoe', children: [{ id: 41, name: '运动鞋' }] },
  { id: 50, name: '配件', icon: 'cap', children: [{ id: 51, name: '帽子' }, { id: 52, name: '包袋' }] }
]

/**
 * 通用尺码表（服装类目共用一份，mock 阶段不按品牌差异化）
 * 身高/体重单位 cm / kg，胸围单位 cm
 */
const SIZE_CHART = {
  unit: 'cm',
  rows: [
    { size: 'S',  height: '170', weight: '58-66', chest: '96' },
    { size: 'M',  height: '175', weight: '66-75', chest: '100' },
    { size: 'L',  height: '180', weight: '75-85', chest: '104' },
    { size: 'XL', height: '185', weight: '85-95', chest: '108' },
    { size: 'XXL', height: '190', weight: '95-105', chest: '112' }
  ]
}

/**
 * 商品 SPU 种子数据（服装）
 * @property {number}   id          商品 ID
 * @property {string}   title       标题
 * @property {number}   categoryId  类目（见 CATEGORIES）
 * @property {number}   originPrice 划线价（分），仅展示不可下单（PRD §①规则 2）
 * @property {number}   sales       销量
 * @property {string}   color       占位色块背景（mock 专用，真实接口无此字段）
 * @property {string}   description 一句话卖点
 * @property {number}   status      0 草稿 / 1 上架 / 2 下架（PRD §①）
 * @property {string}   cover       封面图（static/mall 内绝对路径）
 * @property {Array}    colors      颜色维度 [{ id, name, hex }]
 * @property {Array}    sizes       尺码维度
 */
const goodsSeed = [
  {
    id: 1,
    title: '落肩宽松连帽卫衣 STREET KING 印花',
    categoryId: 11,
    originPrice: 29900,
    sales: 12000,
    color: '#0A0A0A',
    description: '270g 重磅纯棉 · 落肩剪裁',
    status: 1,
    cover: '/static/mall/hoodie.jpg',
    colors: [
      { id: 1, name: '黑色', hex: '#0A0A0A' },
      { id: 2, name: '白色', hex: '#FFFFFF' },
      { id: 3, name: '灰色', hex: '#8C8C8C' }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: 2,
    title: '重磅纯棉印花短袖 P3A',
    categoryId: 12,
    originPrice: 12900,
    sales: 36000,
    color: '#F2F2F2',
    description: '270g 厚磅 · 不透不变形',
    status: 1,
    cover: '/static/mall/tee.jpg',
    colors: [
      { id: 1, name: '白色', hex: '#FFFFFF' },
      { id: 2, name: '黑色', hex: '#0A0A0A' }
    ],
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 3,
    title: '机能工装束脚裤 CARGO',
    categoryId: 21,
    originPrice: 35900,
    sales: 3400,
    color: '#3A3A3A',
    description: '多口袋 · 抽绳束脚',
    status: 1,
    cover: '/static/mall/cargo.jpg',
    colors: [
      { id: 1, name: '黑色', hex: '#0A0A0A' },
      { id: 2, name: '军绿', hex: '#4A4A32' }
    ],
    sizes: ['M', 'L', 'XL', 'XXL']
  },
  {
    id: 4,
    title: '水洗做旧牛仔外套 DENIM',
    categoryId: 31,
    originPrice: 49900,
    sales: 2400,
    color: '#4A6B8A',
    description: '落肩廓形 · 复古水洗',
    status: 1,
    cover: '/static/mall/denim.jpg',
    colors: [
      { id: 1, name: '蓝色', hex: '#4A6B8A' },
      { id: 2, name: '浅蓝', hex: '#8AA8C4' }
    ],
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 5,
    title: '复古厚底运动鞋 RETRO',
    categoryId: 41,
    originPrice: 59900,
    sales: 5600,
    color: '#D9D5CC',
    description: '增高厚底 · 皮革拼色',
    status: 1,
    cover: '/static/mall/sneaker.jpg',
    colors: [
      { id: 1, name: '米白', hex: '#D9D5CC' },
      { id: 2, name: '黑色', hex: '#0A0A0A' }
    ],
    sizes: ['39', '40', '41', '42', '43']
  },
  {
    id: 6,
    title: 'RAWZONE × 涂鸦艺术家联名卫衣',
    categoryId: 11,
    originPrice: 39900,
    sales: 412,
    color: '#FFD500',
    description: '限量 500 件 · 涂鸦艺术家联名',
    status: 1,
    cover: '/static/mall/lookbook.jpg',
    colors: [{ id: 1, name: '黑色', hex: '#0A0A0A' }],
    sizes: ['M', 'L', 'XL']
  },
  {
    id: 7,
    title: '街头廓形教练夹克 VARSITY',
    categoryId: 32,
    originPrice: 45900,
    sales: 1800,
    color: '#1F3A5F',
    description: '字母织标 · 撞色袖条',
    status: 1,
    cover: '/static/mall/hoodie.jpg',
    colors: [
      { id: 1, name: '藏蓝', hex: '#1F3A5F' },
      { id: 2, name: '黑色', hex: '#0A0A0A' }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: 8,
    title: '联名款工装裤（已下架）',
    categoryId: 21,
    originPrice: 32900,
    sales: 890,
    color: '#4A4A32',
    description: '联名限定 · 已售罄',
    status: 2,
    cover: '/static/mall/cargo.jpg',
    colors: [{ id: 1, name: '军绿', hex: '#4A4A32' }],
    sizes: ['M', 'L']
  }
]

/**
 * 构造某商品的 SKU 列表：颜色 × 尺码 笛卡尔积
 * 库存按 (goodsId + 颜色 + 尺码) 稳定散列生成，保证每次启动 mock 库存一致
 * 约定：每个尺码序列的末位（XXL / 43）刻意置 0 库存，用于演示「售罄保留展示」
 * @param {Object} goods 商品 SPU
 * @returns {Array<Object>} SKU 列表
 */
function buildSkus(goods) {
  const list = []
  goods.colors.forEach((c, ci) => {
    goods.sizes.forEach((size, si) => {
      const seed = (goods.id * 97 + c.id * 13 + si * 7) % 20
      const isTailSize = si >= goods.sizes.length - 1
      const stock = isTailSize ? 0 : Math.max(3, seed)
      list.push({
        id: goods.id * 1000 + (ci + 1) * 100 + (si + 1),
        goodsId: goods.id,
        colorId: c.id,
        colorName: c.name,
        colorHex: c.hex,
        size,
        spec: `${c.name} / ${size}`,
        price: Math.round(goods.originPrice * 0.6),
        stock,
        locked: 0
      })
    })
  })
  return list
}

export const db = {
  goods: goodsSeed.map((g) => ({
    ...g,
    images: [g.cover],
    sizeChart: SIZE_CHART
  })),

  /** SKU：由 SPU × 颜色 × 尺码 派生 */
  skus: goodsSeed.flatMap(buildSkus),

  cart: [],

  orders: [],

  /** 预置地址（phone 按规范应密文存储，mock 阶段存明文+脱敏展示，见 PRD T5） */
  addresses: [
    { id: 1, receiver: '张三', phone: '13812348000', region: '天津市 和平区', detail: '南京路 100 号 3-501', isDefault: true },
    { id: 2, receiver: '李四', phone: '18687654321', region: '北京市 朝阳区', detail: '望京 SOHO T1 座 2201', isDefault: false }
  ],

  /**
   * 发售日历（潮牌限量款三态）
   * - type: 'soon'    即将发售 → 倒计时 + 订阅提醒
   * - type: 'live'    正在发售 → 剩余库存 + 抢购
   * - type: 'soldout' 已售罄 → 到货提醒
   * @property {number} goodsId 关联商品
   * @property {string} type    状态
   * @property {number} startAt 发售时间戳
   * @property {number} endAt   结束时间戳
   * @property {number} limit   限量总数
   * @property {number} sold    已售数量
   */
  drops: [
    {
      id: 'D1',
      goodsId: 1,
      type: 'soon',
      title: 'STREET KING 2 · 黑白熊猫联名',
      startAt: Date.now() + 2 * 24 * 3600 * 1000 + 10 * 3600 * 1000,
      endAt: Date.now() + 3 * 24 * 3600 * 1000,
      limit: 800,
      sold: 0
    },
    {
      id: 'D2',
      goodsId: 6,
      type: 'live',
      title: 'RAWZONE × 涂鸦艺术家联名卫衣',
      startAt: Date.now() - 3600 * 1000,
      endAt: Date.now() + 2 * 3600 * 1000,
      limit: 500,
      sold: 412
    },
    {
      id: 'D3',
      goodsId: 2,
      type: 'soldout',
      title: '重磅纯棉印花短袖 P3A',
      startAt: Date.now() - 5 * 24 * 3600 * 1000,
      endAt: Date.now() - 4 * 24 * 3600 * 1000,
      limit: 300,
      sold: 300
    }
  ],

  /** 用户尺码档案（mock 阶段存内存；真实环境随用户表持久化） */
  sizeProfile: {
    height: 175,
    weight: 68,
    fit: 'A',        // Y 偏瘦 / A 标准 / B 偏胖
    updatedAt: Date.now()
  }
}
