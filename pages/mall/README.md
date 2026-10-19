# 商城模块（pages/mall）

> 关联文档：[docs/PRD-商城-v1.1-架构版.md](./docs/PRD-商城-v1.1-架构版.md)（当前主文档）

## 目录结构

```
pages/mall/
├── index.vue                 商城首页（已接通数据层）
├── config.js                 模块配置：mock 开关 / 接口地址 / 业务常量
├── README.md                 本文件
├── docs/                     商城全部文档（PRD、评审意见）
├── api/                      接口层 —— 页面取数唯一入口
│   ├── index.js              统一出口：goodsApi / cartApi / orderApi / addressApi
│   └── http.js               真实请求封装（USE_MOCK=false 时启用）
├── mock/                     mock 层 —— 按 PRD 规则实现的「内存版服务端」
│   ├── index.js              引擎：延迟 / 统一响应 / 通道分发
│   ├── db.js                 内存数据库（商品/SKU/购物车/订单/地址）
│   └── handlers/             处理器（channel = domain.action）
│       ├── goods.js          商品列表 / 详情
│       ├── cart.js           购物车增删改勾选
│       ├── order.js          下单计价 / 锁库存 / 取消 / 模拟支付回调
│       └── address.js        地址增删改 / 设默认
└── utils/
    └── format.js             金额分转元 / 手机号脱敏 / 状态文案
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

- [ ] `pages.json` 路由由你维护；`pages/mall/index` 已注册，无需改动
- [ ] **分包规划（技术审核 T2）**：原生 tabBar 页必须在主包。推荐方案 A——tab 页留 `pages/mall/index`，其余页面放 `subPackages`（root 配 `pages/mall/sub`），M1 建新页面前先定
- [ ] 搜索页 / 商品详情 / 购物车 / 订单列表页，按 M1-M2 里程碑排期
- [ ] `order.mockPay` 通道为 mock 专用，切换真实接口后废弃
