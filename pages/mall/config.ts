/**
 * 商城模块配置
 * 本文件是 mock 与真实接口的唯一切换点
 */
export const MALL_CONFIG = {
  // mock 总开关：true = 全部走 mock 内存服务；false = 走真实接口
  USE_MOCK: true,

  // mock 模拟网络延迟（ms），对齐真实接口体感
  MOCK_DELAY: [200, 500],

  // 真实接口配置（USE_MOCK = false 时生效）
  // 域名需在小程序后台配置 request 合法域名，且支付回调要求 ICP 备案（见 PRD T4）
  BASE_URL: 'https://your-api.example.com',
  API_PREFIX: '/mall',

  // ===== 业务常量（对齐 PRD v1.1）=====
  ORDER_PAY_TIMEOUT: 15 * 60 * 1000, // 待付款超时：15 分钟（§6.2）
  FREE_SHIPPING_THRESHOLD: 9900,     // 满额免邮门槛：99 元（Q7 待业务确认，mock 假定）
  FREIGHT: 800,                      // 运费：8 元（Q7 待业务确认，mock 假定）
  CART_MAX_QUANTITY: 999
}
