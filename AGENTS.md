# AGENTS.md

uni-app 多子项目小程序（商城 / 壁纸 / 天气 / 音乐），Vue 3 + Vite + TypeScript。

## 先读记忆（重要）

本项目的上下文沉淀在 `.workbuddy/memory/`：

| 文件 | 内容 |
| --- | --- |
| `.workbuddy/memory/MEMORY.md` | **长期记忆**：各模块业务约定、踩坑记录、设计稿链接、视觉规范 |
| `.workbuddy/memory/YYYY-MM-DD.md` | 按日工作日志（做完什么、为什么这么做） |

动手改代码前先读 `MEMORY.md`，里面记着不少「从代码里看不出来但一定会踩」的坑。

## 目录约定

```
pages/
├── index/        子项目统一入口（APPS 常量驱动，新增子项目只追加一项）
├── mall/         商城
├── wallpaper/    壁纸
├── weather/      天气
└── music/        音乐（维持独立的严格类型检查）
```

每个子项目自包含：

```
pages/<module>/
├── api/          数据层（index 为统一出口，页面不直接引 source/）
├── components/
├── docs/         业务规则与接入手册
└── design/       设计交付索引（源文件在 Ardot 云端）
```

## 构建与检查

```bash
npm run build:h5          # H5
npm run build:mp-weixin   # 小程序，产物在 dist/build/mp-weixin
npm run typecheck         # 类型检查（全项目 .ts/.vue，并对音乐模块追加严格检查）
```

`cross-env UNI_INPUT_DIR=.` 是必需的 —— uni CLI 在加载 vite 配置前就解析源码目录。

## 编码约定

- **金额一律整数「分」** 存储传输，展示层转元；前端不做金额计算，只渲染服务端返回值
- **数据层单一出口**：页面 import `api/index`，不要跨层直接引 `api/source/*`
- **样式令牌**：各模块 `styles/tokens.scss`，禁止在页面里散落硬编码色值
- **条件编译**：`// #ifdef MP-WEIXIN` 是注释，TypeScript 看不到分支差异，涉及平台差异的地方需要类型断言
- **微信胶囊安全区**：375 宽下占 `x∈[278,375]`、`y∈[48,80]`，顶栏右侧必须让出，且真机要用 `wx.getMenuButtonBoundingClientRect()` 动态算

## 外部依赖注意

小程序请求需要域名在后台配置且通过 ICP 备案。境外数据源（Open-Meteo / Audius / Pexels）的处理方式各不相同，见各模块 `docs/域名与备案.md` 或 `docs/微信域名配置.md`。
