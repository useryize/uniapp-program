# UniFlow · uni-app 多应用小程序

一个基于 **uni-app、Vue 3、Vite 和 TypeScript** 的多模块项目。首页提供统一入口，包含潮流商城、极简壁纸、天气助手和独立音乐四个应用，可构建为 H5 页面或微信小程序。

## 应用模块

| 模块 | 主要内容 | 代码位置 |
| --- | --- | --- |
| 潮流商城 | 商品浏览、尺码选择、购物车、下单与订单管理；目前使用内存 mock 服务端 | `pages/mall/` |
| 极简壁纸 | 壁纸首页、推荐与发现页面 | `pages/wallpaper/` |
| 天气助手 | 实时天气、逐时与多日预报、空气质量、生活指数和降水雷达 | `pages/weather/` |
| 独立音乐 | 音乐发现、搜索、歌单、榜单与播放 | `pages/music/` |

应用入口在 `pages/index/`，页面路由统一配置于 `pages.json`。各模块的业务代码与文档放在自己的目录中；有接口层的模块通过 `api/index.ts` 向页面提供数据。

## 本地运行

需要 Node.js 和 npm。安装依赖后按目标平台启动：

```bash
npm install
npm run dev:h5
# 或
npm run dev:mp-weixin
```

构建与类型检查：

```bash
npm run build:h5
npm run build:mp-weixin
npm run typecheck
```

微信小程序构建产物位于 `dist/build/mp-weixin`，可用微信开发者工具导入。项目使用根目录作为 uni-app 源码目录，相关脚本已设置 `UNI_INPUT_DIR=.`。

## 接入说明

商城默认启用 mock 服务，切换真实接口参见 [商城模块说明](pages/mall/README.md)。天气和音乐使用外部数据源；微信小程序运行前需按 [天气域名配置](pages/weather/docs/微信域名配置.md) 和 [音乐域名与备案](pages/music/docs/域名与备案.md) 配置合法域名，并核对上线所需的服务授权。

各模块的产品规则、设计索引和接入细节见对应的 `docs/`、`design/` 目录。
