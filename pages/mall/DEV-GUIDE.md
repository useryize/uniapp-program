# 商城前端开发说明（街头潮流服装电商）

> 对应高保真交互稿：`pages/mall/design/`（源文件在 Ardot：`https://ardot.tencent.com/file/739096499841184`）
> 视觉体系与交互规则见 `pages/mall/design/README.md`

---

## 一、目录与新增内容

```
pages/mall/
├── index.vue              商城首页（重做：品牌栏 / Hero / 服务入口 / 秒杀 / 推荐流）
├── category/index.vue     分类页（新增：左类目栏 + 排序 + 二级类目 + 网格）
├── search/index.vue       搜索页（重做：结果改横向行式，突出规格与价格）
├── detail/index.vue       商品详情（重做：尺码推荐条 / 售罄保留 / 吸底规格栏 / 大面板）
├── cart/index.vue         购物车（重做：凑单提示 / 规格可改 / 空态）
├── confirm/index.vue      订单确认（重做：黑底地址卡 / 优惠券行 / 应付金额）
├── pay/result.vue         支付结果（重做：待支付 / 成功 / 异常三态）
├── order/list.vue         订单列表（重做：黑底选中 tab / 状态色）
├── order/detail.vue       订单详情（重做：黑底状态区 + 时间轴）
├── size-guide/index.vue   尺码助手（新增：身高体重 → 推荐 + 尺码表）
├── drop/index.vue         发售日历（新增：限量款三态 + 倒计时 + 订阅）
├── components/
│   ├── goods-card.vue     商品卡（重做：硬描边 + 黄色角标）
│   ├── size-picker.vue    尺码选择器（新增：售罄保留三态 + 颜色/尺码联动）
│   ├── stepper.vue        数量步进器（新增）
│   └── section-head.vue   区块标题（新增）
├── mock/
│   ├── db.js              数据源（重做：颜色×尺码双维 SKU / 尺码表 / 发售日历 / 尺码档案）
│   └── handlers/
│       ├── size.js        尺码域（新增：推荐 / 尺码表 / 档案读写）
│       └── drop.js        发售域（新增：列表 / 订阅）
└── api/index.js           接口出口（新增 sizeApi / dropApi / cartApi.updateSku）

static/
├── mall/                  商品图 7 张（12M → 813K 压缩）
│   └── icons/             21 个线性图标（PNG，替代 emoji）
└── tabbar/                4 个 tabBar 图标（81×81，8 个文件）
```

---

## 二、视觉体系落地方案

设计稿用的是 Archivo Black / Bungee / Noto Sans SC。**小程序不引字体文件**（包体代价高），用系统字重还原：

| 设计稿 | 实现 |
|---|---|
| Archivo Black（大价格/标题） | `font-weight: 900` + 大字号 |
| 2px 纯黑硬描边、圆角 0 | `border: 4rpx solid #0A0A0A`（4rpx = 2px @750 基准） |
| 酸性黄 `#FFD500` 主 CTA | `background-color: #FFD500` |
| 价格红 `#E24B4A` | 同名变量 |
| 图标 | 21 个 PNG 线性图标（`static/mall/icons/`），不用 emoji |

**令牌集中在 `uni.scss`**（uni-app 全局注入，页面无需 import）：

```scss
$rz-ink: #0A0A0A;   $rz-acid: #FFD500;  $rz-price: #E24B4A;
$rz-border-w: 4rpx; $rz-radius: 0;     $rz-page-pad: 32rpx;
```

---

## 三、数据层扩展（保持 `api → mock` 分层不变）

新增两个域，页面仍只 import `api/index.js`：

```js
sizeApi.recommend({ height, weight, fit })  // → { size, reason, chart, range }
sizeApi.chart({ goodsId, height, weight })  // → { unit, rows, recommendSize }
sizeApi.profile() / sizeApi.saveProfile()  // 尺码档案
dropApi.list({ type })                      // 发售三态
dropApi.subscribe({ goodsId })              // 订阅提醒
cartApi.updateSku({ id, skuId, quantity })  // 购物车改规格
```

**SKU 模型变更**：`goodsId*10+n` → `goodsId*1000 + 色序*100 + 码序`，由 `颜色 × 尺码` 笛卡尔积派生。handler 内全部通过 `db.skus.find()` 查找，调用方无感知。

**新增 mock 通道**：`goods.categories`、`size.recommend`、`size.chart`、`size.profile.get`、`size.profile.save`、`drop.list`、`drop.subscribe`、`cart.updateSku`。

---

## 四、路由与 tabBar

- 新增 3 个路由：`pages/mall/category/index`、`pages/mall/size-guide/index`、`pages/mall/drop/index`
- tabBar 由 2 个扩到 **4 个**：首页 / 分类 / 购物车 / 我的
  - 分类页、购物车页是 tabBar 页，**跳转必须用 `uni.switchTab`**
  - 「我的」沿用 `pages/wallpaper/person/index`（全局用户中心），已改造为设计稿风格并接入商城订单 / 尺码档案 / 发售提醒

> ⚠️ tabBar 原生不支持设计稿的「胶囊式」TabBar，落地为系统 tabBar + 街头风实心几何图标。若要完全还原胶囊样式，需放弃系统 tabBar 改为自绘组件（会失去 switchTab 的页面栈管理，不推荐）。

---

## 五、8 条服装电商关键规则 → 代码落点

| 规则 | 落点 |
|---|---|
| 1 尺码推荐/尺码表三处可达 | `detail` 尺码推荐条 + `size-picker` 内助手入口 + `cart` 规格行「点击修改」 |
| 2 售罄尺码保留 + 置灰划线 | `components/size-picker.vue`：`soldout-mask` 遮罩 + `line-through`，**不做 v-if 过滤** |
| 3 规格入口悬浮吸底 | `detail` `.float-spec`（`position: fixed`） |
| 4 可滑动大面板 + 尺码助手 + 双按钮 | `detail` `.sku-popup` 1080rpx + `scroll-view` + 加购/立即购买 |
| 5 关闭再打开回显已选 | `size-picker` 的 `watch(() => [props.colorId, props.size])` |
| 6 购物车改规格 + 凑单提示 | `cart` `.ship-tip` + `cartApi.updateSku` |
| 7 限量款三态 | `drop` 三态渲染 + `db.drops` 三态种子数据 |
| 8 尺码档案持久化 | `mock/handlers/size.js` `size.profile.*`，跨商品复用 |

---

## 六、验证方式

项目未安装 uni-app 依赖（`node_modules` 不在仓库内），无法跑官方构建。已用四层校验替代：

```bash
# 1. SFC 编译（template / script setup / SCSS 令牌注入）
npm i --no-save @vue/compiler-sfc sass
node .workbuddy/tmp/check-vue.mjs          # 15/15 通过

# 2. 数据层冒烟（新增域 + 交易链路 + 错误码边界）
node --import ./.workbuddy/tmp/register.mjs .workbuddy/tmp/smoke-mock.mjs   # 19/19 通过

# 3. 路由可达性（未注册页面 / tabBar 页误用 navigateTo）
node .workbuddy/tmp/check-routes.mjs        # 23 处跳转，0 问题

# 4. 设计稿规则覆盖（8 条规则 33 个检查点）
node .workbuddy/tmp/check-design-rules.mjs  # 33/33 通过
```

> 校验脚本在 `.workbuddy/tmp/`（未纳入版本管理），`node_modules` 已清理。
> **真机/模拟器效果仍需在 HBuilderX 或微信开发者工具中运行确认**，本次只做了静态与逻辑层验证。

---

## 七、遗留与待确认

| 项 | 说明 |
|---|---|
| 运费规则 | 满 ¥99 免邮否则 ¥8，PRD Q7 待业务确认 |
| 优惠券 | 结构已预留（`discountAmount`），V1 恒 0，页面显示 ¥0 |
| 尺码档案持久化 | 当前存 mock 内存，真实环境需落用户表 |
| 发售提醒推送 | 当前为静态回执，真实环境需接订阅消息 |
| 退款/售后 | 入口已占位提示，售后域 M4 交付 |
| 地址管理 | 结算页用默认地址，地址编辑页未做 |
| 分类页二级类目 | mock 已提供 `children`，页面已支持二级筛选 |
| 商品图 | `static/mall/*.jpg` 为 AI 生成的示意图，接真实 CDN 后替换 `goods.cover` |
