# 应用首页入口（pages/index）

子项目统一入口设计稿与实现说明。

## 设计文件

- **Ardot 云端**：`https://ardot.tencent.com/file/740919646771918`（fileId `740919646771918`）
- 源文件仍在云端，本目录 `screens/` 为导出快照，不可反向编辑。

| 屏 | 内容 | 节点 |
|---|---|---|
| 01 · 应用首页 | 默认态：2 个大卡片入口 + 预留位 | `2:1` |
| 02 · 全部应用 | 扩展态：2×3 网格 + 添加占位 | `2:78` |

## 视觉体系

深色高级感基调。入口页是「壳」，刻意与两个子项目的强风格做区隔：

- **底色** `#0A0D13` 深墨蓝
- **氛围光晕** 靛蓝 `#3D5AFF` / 紫罗兰 `#7C4DFF` / 暖杏 `#FFA45C`，径向弥散
- **卡片面** `#171C27`，描边 `rgba(255,255,255,0.10)`
- **文字** 主 `#FFFFFF` / 次 `#8C93A0` / 弱 `#6E7684` / 版本 `#4A515E`
- **子项目标识色** 商城 `#FFD500`（沿用商城品牌色）、壁纸 `#7FA8FF`
- **圆角** 主卡 12px / 网格项 10px / 标签 6px
- **字体** Noto Sans SC（中文）+ Inter（数字/英文）

## 布局要点

- **首页**：大卡片承载子项目，每张卡 = 图标 + 名称 + 描述 + 封面图 + 标签行 + 「进入」。
  封面图使用子项目真实素材（商城用 `static/mall/tee.jpg`），壁纸用渐变占位。
- **扩展态**：2 列网格，超出后自动换行；末位固定「添加新应用」虚线占位。
- 两屏共用 `styles/tokens.scss`。

## 扩展方式

新增子项目只需在页面 `APPS` 常量数组追加一项：

```js
{
  id: 'xxx', name: 'XXX', desc: '...', tag: '...', meta: '...',
  color: '#RRGGBB',          // 图标与强调色
  iconBg: 'rgba(...)',       // 图标底色
  iconBorder: 'rgba(...)',   // 图标描边
  tagBg: 'rgba(...)',        // 标签底色
  glow: 'rgba(...)',         // 卡片氛围光
  cover: '/static/xxx.jpg',  // 封面图，可空
  coverGradient: 'linear-gradient(...)',
  url: '/pages/xxx/index'
}
```

布局无需改动。首页（`index.vue`）用大卡片展示前 N 个，完整列表走「全部应用」页（`apps.vue`）。

## 路由

`pages.json` 中 `pages/index/index` 置于首位，即小程序启动页。

## 实现文件

```
pages/index/
├─ index.vue            首页（默认态）
├─ apps.vue             全部应用（扩展态）
├─ styles/tokens.scss   共享设计令牌
└─ design/screens/      设计稿导出快照
```
