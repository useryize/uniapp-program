# 商城模块（pages/mall）

> 关联文档：[docs/PRD-商城-v1.1-架构版.md](./docs/PRD-商城-v1.1-架构版.md)（当前主文档）

## 目录结构

```
pages/mall/
├── index.vue                 商城首页（列表+分页+快捷加购）
├── config.js                 模块配置：mock 开关 / 接口地址 / 业务常量
├── README.md                 本文件
├── docs/                     商城全部文档（PRD、评审意见、交互规格说明书）
├── api/                      接口层 —— 页面取数唯一入口
│   ├── index.js              统一出口：goodsApi / cartApi / orderApi / addressApi
│   └── http.js               真实请求封装（USE_MOCK=false 时启用）
├── components/
│   └── goods-card.vue        商品卡公共组件（首页/搜索复用）
├── mock/                     mock 层 —— 按 PRD 规则实现的「内存版服务端」
│   ├── index.js              引擎：延迟 / 统一响应 / 通道分发
│   ├── db.js                 内存数据库（商品/SKU/购物车/订单/地址）
│   └── handlers/             处理器（channel = domain.action）
│       ├── goods.js          商品列表 / 详情（支持 id 或 skuId 反查）
│       ├── cart.js           购物车增删改勾选
│       ├── order.js          计价/锁库存/支付回调/发货/确认收货/取消
│       └── address.js        地址增删改 / 设默认
├── detail/index.vue          商品详情（SKU 弹层联动 / 加购 / 直购）
├── person/index.vue          个人中心（订单 / 尺码档案 / 发售提醒）
├── cart/index.vue            购物车（勾选/改量/失效区/结算栏）
├── confirm/index.vue         结算页（购物车 ids / 直购 skuId 双入口）
├── pay/result.vue            支付结果（待支付/成功/超时竞态三态）
├── order/list.vue            订单列表（五状态 tab / 分页 / 按状态渲染操作）
├── order/detail.vue          订单详情（时间轴 / 快照 / 金额明细）
├── search/index.vue          搜索（防抖 300ms / 本地历史 10 条）
└── utils/
    └── format.js             金额分转元 / 手机号脱敏 / 状态与时间格式化
```

## 核心设计：mock = 内存版服务端

mock 层**不是假数据回显**，而是按 PRD v1.1 业务规则实现的内存服务端：

| PRD 规则 | mock 落地位置 |
| --- | --- |
| 金额一律整数分，服务端计价（§7.1） | `order.create` 忽略前端金额，按 SKU 实时价计算 |
| 下单锁库存 / 支付实扣 / 超时释放（§7.2） | `db.skus` 双字段 `stock`（可售）+ `locked`（锁定） |
| 订单快照固化（§7.1 规则 3） | `order.create` 冻结标题/规格/单价/地址 |
| 支付以回调为唯一依据（§7.3） | `order.mockPay` 模拟回调通道，超时支付抛竞态错误 |
| 加购即校验库存上限（§③） | `cart.add` / `cart.updateQty` |

因此**切换真实接口时，页面与业务规则代码零改动，只换传输层**。

## 切换真实接口（三步）

1. **改开关与地址**：`config.js`
   ```js
   USE_MOCK: false,
   BASE_URL: 'https://你的后端域名',
   ```
2. **小程序后台**：把 `BASE_URL` 域名加入 request 合法域名（支付回调域名需 ICP 备案，见 PRD 技术审核 T4）。
3. **后端实现**：按 `api/index.js` 中每个方法的 `url` 与参数实现接口，响应结构统一为：
   ```json
   { "code": 0, "data": {}, "msg": "ok" }
   ```
   `code !== 0` 即业务失败，`msg` 会直接展示给用户。

## 新增接口规范（三处同步）

1. `mock/handlers/<domain>.js`：加 handler，channel 命名 `domain.action`
2. `api/index.js`：加方法，绑定 `channel` 与真实 `url`
3. 页面只 `import { xxxApi } from '../api/index.js'`，**禁止**直接引用 mock

## 编码约定

- 金额：整数分存储传输，展示层用 `fen2yuan()` 转元
- 错误：handler / 服务端通过 `{ code, msg }` 报错，页面统一 `catch (e) => e.msg` 提示
- 注释：文件头说明设计意图，函数带 JSDoc，关键逻辑标注对应 PRD 章节
- 占位资源：mock 阶段封面用 `color` 色块，`cover` 字段留空；接接口后自动切图片，色块字段可删

## 待办与注意

- [x] M1-M2 用户侧页面全部交付（详情/购物车/结算/支付结果/订单/搜索），路由已接入 `pages.json`
- [ ] **分包规划（技术审核 T2）**：tab 页（`pages/mall/index`）必须留主包；其余页面后续迁 `subPackages`（root 配 `pages/mall/sub`），迁移时需同步改页面内跳转路径
- [ ] 地址管理页（新增/编辑/设默认，接口已就绪）、收藏/浏览历史（M5）
- [ ] 退款售后（M4：aftersale 实体 + handler + 页面）
- [ ] `order.mockPay` / `order.mockShip` 为 mock 专用通道，切换真实接口后废弃（mockShip 由后台发货接口替代）
