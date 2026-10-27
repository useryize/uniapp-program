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
├── person/index.vue       个人中心（商城订单 / 尺码档案 / 发售提醒）
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
└── mall/                  商品图 7 张（12M → 813K 压缩）
    ├── icons/             21 个线性图标（PNG，替代 emoji）
    └── tabbar/            4 个 tabBar 图标（81×81，8 个文件）
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

**令牌集中在 `pages/mall/styles/tokens.scss`**，商城页面和组件在各自的 SCSS 中按相对路径引入：

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

## 四、路由与商城页面内导航

- 新增 3 个路由：`pages/mall/category/index`、`pages/mall/size-guide/index`、`pages/mall/drop/index`
- 商城四个主页面：首页 / 分类 / 购物车 / 我的，都渲染 `components/mall-tabbar.vue`。
- 四个页面不在 `pages.json` 注册原生 tabBar；页面内切换用 `uni.redirectTo`，从商品详情等子页面进入购物车用 `uni.navigateTo`。
- 「我的」位于 `pages/mall/person/index`，接入商城订单 / 尺码档案 / 发售提醒。

> 未来主入口使用 `uni.navigateTo({ url: '/pages/mall/index' })` 进入商城；商城内切换不占用主入口的全局导航。

> 所有商城 `.vue` 样式块声明 `lang="scss"` 并引入 `styles/tokens.scss`，否则 `$rz-*` 设计变量不会正确编译。`check-vue.mjs` 会检查样式编译。

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

项目未安装 uni-app 依赖（`node_modules` 不在仓库内），无法跑官方构建。已用六层校验替代：

```bash
npm i                      # 装 devDependencies（@vue/compiler-sfc + sass）

node pages/mall/tools/check-alignment.mjs     # 高保真对齐断言  66/66
node pages/mall/tools/audit-style.mjs         # 样式 token 审计  0 偏差
node pages/mall/tools/check-routes.mjs        # 路由可达性      0 问题
node pages/mall/tools/check-design-rules.mjs  # 设计稿规则覆盖  33/33
node pages/mall/tools/check-vue.mjs           # SFC + SCSS 编译校验    17/17
node --import ./pages/mall/tools/reg.mjs \
     pages/mall/tools/smoke-mock.mjs          # 数据层冒烟      19/19
```

工具位于 `pages/mall/tools/`，可重复执行。`reg.mjs` + `loader.mjs` 是 Node ESM 垫片
（项目源码用 vite 风格的无扩展名导入，Node 直跑 mock handler 时需要）。

> ⚠️ **真机/模拟器效果仍需在 HBuilderX 或微信开发者工具中运行确认**。
> 当前仓库的 `npm run build:h5` 使用普通 Vite，未配置 uni-app 插件，构建在解析 `main.js` 的 `./App` 时失败；需在 HBuilderX 或微信开发者工具中做运行时截图对比。

---

## 七、样式对齐基线（高保真 ↔ 代码）

对齐断言的基准取自 `pages/mall/design/screens/*.png`，核心规则：

| 规则 | 说明 |
|---|---|
| **页面区块通栏无边框** | `.panel` / `.card` / `.goods-block` 等页面级区块**不加** 2px 描边，靠背景色与留白分段 |
| **按画面选择描边** | 按钮、选项块和首页商品卡用 `4rpx solid #0A0A0A`；分类商品卡、购物车商品行和订单卡为无描边白底 |
| **Hero 图文分离** | 图片与标题文案是两个独立区块，标题在图下方的黑底区，不叠在图上 |
| **商品卡角标在图下** | 独立成行（黑底黄字），不叠在图片左上角 |
| **封面 1:1** | 高度由调用方按卡宽传入（`cover-height` prop） |
| **底部按钮竖排全宽** | 详情页底部 = 规格条 + 加购（全宽白底黑框）+ 立即购买（全宽黄底黑框） |
| **分类页类目栏白底** | 选中项为黑块黄字，类目之间无分隔线 |
| **个人中心面板连续** | 「我的订单」与「功能宫格」两块白底相连，功能宫格 4 列 |
| **发售日历三态配色** | 待售黄 / 在售红 / 已售灰 |

审计脚本 `audit-style.mjs` 会对硬编码色值、非 0 圆角、描边宽度、字号体系、
左右边距做全量扫描，合法例外（分隔线、图形描边、mock 占位首字）已在脚本内注明。

---

## 八、遗留与待确认

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
