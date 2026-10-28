# MEMORY — 项目长期记录

## 项目概况

- **E:/github/uniapp-program**：uni-app 小程序项目，含「商城」「壁纸」「天气」三个业务模块。
- 商城模块文档位于 `pages/mall/docs/`：
  - `PRD-商城-v1.1-架构版.md`（业务规则源）
  - `交互规格说明书-商城M1-M2.md`（页面流 × 交互规则 × 验收标准）
- 路由清单见 `pages.json`；数据层统一走 `pages/mall/api/index.js` → mock 内存服务端（`pages/mall/mock/`）。
- **应用首页入口**（`pages/index/`）：子项目统一入口，2026-10-27 新增。
  - `index.vue` 默认态（大卡片）· `apps.vue` 扩展态（2 列网格）· `styles/tokens.scss` 共享令牌
  - `pages.json` 中 `pages/index/index` 置于首位 = 小程序启动页
  - **扩展约定**：新增子项目只需在页面 `APPS` 常量数组追加一项，布局零改动
  - 设计稿 Ardot：`https://ardot.tencent.com/file/740919646771918`

## 子项目入口页的视觉定位（重要）

入口页是「壳」，**刻意与两个子项目的强风格做区隔**：

| 模块 | 风格 | 底色 |
|---|---|---|
| 商城 | Y2K 粗野主义，酸黄撞色 | `#0A0A0A` |
| 壁纸 | 轻白瀑布流 | `#FFFFFF` |
| 天气 | 暖白画布 + 深蓝渐变英雄区 + 玻璃拟态 | `#F5F7FA` |
| **入口页** | **深色高级感，柔和渐变光晕** | **`#0A0D13`** |

入口页色板：靛蓝 `#3D5AFF` / 紫罗兰 `#7C4DFF` / 暖杏 `#FFA45C` 光晕，卡片面 `#171C27`，
文字四级 `#FFFFFF` / `#8C93A0` / `#6E7684` / `#4A515E`。子项目标识色：商城 `#FFD500`、壁纸 `#7FA8FF`。
圆角主卡 12px / 网格项 10px / 标签 6px；字体 Noto Sans SC + Inter。

## 天气查询系统（2026-10-28，设计 + 编码均已完成）

- 设计稿 Ardot：`https://ardot.tencent.com/file/741184924195659`
  - 8 个页面（375×812）+ 3 块设计系统板（天气图标库 / 导航组件 / 规范总览）
  - 天气图标库共 **11 个 reusable 组件**：晴/多云/阴/雨/小雨/雪/雾/霾/夜/雷暴/冻雨（WMO 码全覆盖）
- 文档：`pages/weather/docs/`
  - `UI设计规范.md`（色彩/字阶/圆角/组件规格/uni-app 实现要点/接口 JSON 建议）
  - `接口选型方案.md`（免费接口实测对比 + 缓存策略 + WMO→图标映射表）
  - `接入说明.md`（运行方式 + 目录结构 + 已知限制）
  - `微信域名配置.md`（后台直达地址 + 域名清单 + 备案口径 + 报错速查）
- 视觉：主色 `#014DB2`，深蓝渐变 `#014DB2→#001645`，语义色 绿 `#10B981` / 橙 `#F59E0B` / 红 `#EF4444`；
  画布 `#F5F7FA`，主温度 88px Inter Light；底部胶囊导航 62px / 圆角 36px，激活项填主色
- 字体分工（沿用商城约定）：Inter 管数字与英文，Noto Sans SC 管中文

**代码位置**：`pages/weather/`
- 8 个页面：home/index · city/search · city/manage · detail/hourly · detail/trend · detail/air · detail/indices · explore/radar
- `api/` 分层（对齐商城约定）：http / weather(适配器) / radar / city / index(统一出口)
- `utils/`：wmo(WMO码映射) · units(风级·AQI·时间) · indices(8项生活指数自算)
- `components/`：weather-tabbar · weather-nav · weather-chart(canvas 折线图)
- `data/cities.js`：367 城静态库（adcode+坐标+拼音），**存为 .js 而非 .json**（小程序端 JSON import 行为不一致）
- `static/weather/icons/`：30 个 PNG（11 天气 + 11 深底变体 + 8 指数），**用 PNG 而非内联 SVG**（小程序 image 对 SVG 支持不稳）
- 入口：首页 `pages/index/index.vue` 的 `APPS` 数组已追加天气项（**扩展约定：只追加一项，布局零改动**）

**接口选型（2026-10-28 实测）**
- 推荐组合：**Open-Meteo**（免 Key，1万次/天，16天预报+空气质量）+ **RainViewer**（雷达瓦片，免 Key）+ **本地城市库**
- 缺口与对策：Open-Meteo **无生活指数** → 8 项已自算（`utils/indices.js`）；Open-Meteo **中文地理编码有歧义**（"杭州"会返回四川甘孜）→ 已用本地城市库；RainViewer `nowcast` 实测为空 → 已做降级提示
- ⚠️ **商业授权是硬门槛**：Open-Meteo/RainViewer 免费层均不允许商用，上线运营需换和风/彩云
- ⚠️ **CO 单位口径**：国标限值 4 mg/m³，接口返回 μg/m³，限值表须用 4000，否则永远显示「超标」

**构建**：`npm run build:h5` / `npm run build:mp-weixin`（`cross-env UNI_INPUT_DIR=.` 必须，uni CLI 在加载 vite 配置前就解析源码目录）

## 服装电商交互逻辑（调研沉淀，2026-10-22）

> 来源：人人都是产品经理《设计总结：商品规格选择弹窗》《优化"商品规格选择"面板》、
> 得物/识货/Nice 竞品分析、SNKRS/滔搏运动、GitHub macrozheng/mall-app-web。

**服装电商 ≠ 通用商城**，核心决策点完全不同：

| 维度 | 通用商城 | 服装电商 | 潮牌 |
|---|---|---|---|
| 核心决策 | 规格选择 | **尺码决策** | **发售机制/稀缺性** |
| 尺码 | 无 | 尺码推荐 + 尺码助手 + 尺码表 + 尺码档案 | 尺码表 + 发售提醒 |
| 售罄规格 | 置灰隐藏 | **保留展示 + 置灰划线** | 保留 + 强调稀缺 |
| 规格入口 | 页面中部静态 | **悬浮吸底**，滑动可见 | 悬浮 + 倒计时 |
| 颜色选择 | 纯色块 | **图文结合**，选中刷新主图 | 同左 |
| 面板按钮 | 双按钮 | 双按钮 + 尺码助手入口 | 抢购/提醒 |
| 库存表达 | "仅剩N件" | 紧张库存提示条 | 倒计时 + 订阅推送 |

**关键规则（8 条）**：
1. 尺码推荐条 + 尺码表入口要出现在详情页 / 规格面板 / 购物车三处。
2. 售罄规格保留展示不隐藏——稀缺性需要被看见。
3. 规格入口悬浮吸底，避免用户回滚找尺码。
4. 规格面板为可滑动大面板（含尺码助手），底部双按钮「加购 + 立即购买」。
5. 关闭面板再打开回显上次已选规格；颜色切换即时刷新主图。
6. 购物车内可直接改规格（点规格区唤起面板）+ 凑单提示条。
7. 限量款三态：即将发售(倒计时+订阅) / 正在发售(剩余库存+抢购) / 已售罄(到货提醒)。
8. 用户侧尺码档案持久化，跨商品复用推荐结果，降低退换货率。

**规格选项三态**：已选(反白/填充) / 未选(描边) / 不可选(置灰+删除线或虚线)。
**面板两大形态**：可滑动(有进度条，信息多时) vs 固定(信息少时，减少误操作)。

## 商城业务关键约定

- 金额一律整数「分」存储传输，展示层用 `fen2yuan()` 转元；**前端不计算金额，只展示服务端返回值**。
- 订单状态机：`UNPAID → PAID → SHIPPED → FINISHED`，终态 `FINISHED` / `CANCELED` 不可逆。
- 待付款超时 15 分钟；下单转锁定库存，支付转实扣，超时/取消释放。
- 运费规则（待业务确认）：满 ¥99 免邮，否则 ¥8 —— 定义在 `pages/mall/config.js`。
- 幂等：提交类按钮点击后立即置 loading 防重；服务端错误码 40001/40004/40006 有固定文案。

## 设计稿（Ardot）

- **文件**：街头潮流服装电商小程序 - 高保真交互稿
  `https://ardot.tencent.com/file/739096499841184`（fileId `739096499841184`）
- **本地归档**：`pages/mall/design/`（源文件仍在云端，本地是导出物，不可反向编辑）
  - `README.md` 索引说明 · `screens/` PDF + 17 张 2x PNG · `assets/` 7 张商品图
- **视觉体系**：街头潮流 / Y2K 粗野主义
  - 色彩：墨黑 `#0A0A0A`、酸性黄 `#FFD500`、价格红 `#E24B4A`、纯白 `#FFFFFF`、浅灰 `#F2F2F2`、次要文字 `#8C8C8C`
  - 字体：Archivo Black（价格/英文装饰）、Bungee（英文标牌）、Noto Sans SC（中文标题/正文）、Inter（数字）
  - 硬边框 2px 纯黑、圆角 0；主 CTA 酸性黄底、次级白底黑边、禁用 `#BFBFBF`
  - 基准尺寸 375 × 812（小程序）
- **包含 13 个页面 + 交互流程图 + 设计系统板**，页面编号 01–15 均带路由标注。
- 可复用组件（`reusable: true`）：状态栏（深/浅）、返回导航栏、TabBar、商品卡 165、数量步进器。

## Ardot 平台踩坑记录（重要）

1. **批量插入的父子关系**：同一 batch_edit 内先建容器、再建子节点时，若用「猜的 ID」作 parent 会静默失败
   （子节点被挂到页面根层）。必须用**同批次内的绑定名**作 parent。
2. **批量插入顺序**：子节点的插入会排在父节点**前面**（导致文字在按钮左侧）。稳妥做法是
   先建完所有容器 → 统一 `M()` 归位 → 最后插文字。
3. **`textDecoration` 不生效**（删除线无效）。划线价改用「文字 + 覆盖一条 1px 线框」实现。
4. **`U()` 传 `descendants` 无效**；实例内子节点要用 `实例ID;子节点ID` 路径，但改高度类属性
   可能被组件源覆盖，实测改组件源 `2:66` 更可靠。
5. **实例不继承组件的尺寸更新**；改组件源后各实例需单独核对。
6. **SVG 节点**：路径不合法会报 `degenerate geometry`；`layout: "none"` 时不能用
   `primaryAxisAlignItems`。
7. **register_assets**：每个资源槽位独立，上传 URL 与下载 URL 的签名不同，混用会 403
   （SignatureDoesNotMatch）。一张图一个槽位。
8. `fill_container` 宽度用在横向 flex 兄弟节点上会把其他兄弟挤出可视区（Tab 栏变竖排），
   需给固定宽度。
9. `marginTop` / `marginBottom` / `marginLeft` 属性有效，可用于间距微调。
10. 绝对定位节点用 `layoutPositioning: "ABSOLUTE"` + `x` / `y`（放在父级 flex 中时 x/y 被忽略）。
11. `layout:"none"` 的空 frame 即使有 fill，导出 PNG/PDF 时也不绘制（半透明遮罩做不出来）。
12. 对同一节点多次 U() 时，后一次不带 padding 会把之前 padding 重置为 0；不带
    `layoutPositioning:"ABSOLUTE"` 会把吸底元素重置回内容流。改属性要一次写全。
13. 横向 flex 多列布局：子项写死宽度会互相挤出可视区，宽度 = (可用宽 − gap×(n−1))/n
    再留 3~5px 余量。
14. `capture_layout` 的 LARGE_EMPTY_AREA 对「按钮文字居中」会误报（左右对称留白是正常的），
    判断标准是留白是否对称；`layoutMode` 对 `wrap` 也报 HORIZONTAL，判断换行要看 bounds 分布。
15. **TEXT 节点不支持 padding**（`padding` 只对 frame 生效），给文字设边距会被静默忽略。
    要让文字有左右边距，用带 padding 的 frame 容器包住它再 M 进去。
    这类贴边问题 `capture_layout` 检测不出来，只能读导出图确认。
16. **`SPACE_BETWEEN` + 子元素 `fill_container` 会导致宽度计算失效**，正文溢出压到右侧固定宽
    元素（如图标、封面图）下方。改用 `MIN` + 显式 `gap`。
17. **flex 父级内 `layoutPositioning:"ABSOLUTE"` + x/y 的坐标基准易错**，按钮会溢出卡片边界。
    需要在卡片内定位时，优先用流内布局：先建容器再 `M()` 归位。
18. **`M(node, parent, index)` 带 index 调整兄弟顺序不生效**，会出现图标夹在标题与描述之间。
    把图标 `M()` 进其容器内部（图标底），而不是在卡片层面调顺序。
19. **`GRADIENT_RADIAL` 的色标必须带 `a` 字段**（`{r,g,b,a}`），漏写 `a` 会解析失败；
    但 `SOLID` 类型只认 r/g/b。
20. **批量插入时 text 节点 `name` 必须唯一**，重名（如两个「标签文字」）会导致该 op 被拒。
21. **AI 生图 `G()` 是异步的**，未完成时截图显示 "Image Placeholder"。小尺寸封面用手写
    `GRADIENT_LINEAR` 三色渐变更快更可控，不必等生图。

## 工作约定

- **不要主动导出素材**（PNG / PDF 很费积分）。只有用户明确说「导出 / 重新导出」时才调用
  `export_nodes`。检查/修复阶段只在画布上改。
- 导出为覆盖式，无增量；本地不保留历史版本，由 git 跟踪。


## 素材

- AI 生成的商品图（已裁掉右下角水印）存于 `.workbuddy/assets/mall-design/`：
  `tee.png` `hoodie.png` `denim.png` `sneaker.png` `cargo.png` `hero.png` `lookbook.png`
