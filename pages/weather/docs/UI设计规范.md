# 天气查询系统 · UI 设计规范

> 设计稿：Ardot `https://ardot.tencent.com/file/741184924195659`
> 版本 v1.0　·　基准 375 × 812　·　适配 iOS / Android / 微信小程序
> 状态：**仅设计稿**，未进入编码阶段

---

## 一、页面清单

| # | 页面 | 路由建议 | 说明 |
|---|------|---------|------|
| 01 | 首页 · 当前天气 | `pages/weather/index` | 城市切换、实时温度、指标条、24h 预览、7 日预览 |
| 02 | 城市搜索 | `pages/weather/city-search` | 定位城市、热门城市、历史记录 |
| 03 | 城市管理 | `pages/weather/city-manage` | 当前城市卡、已添加列表、拖拽排序、添加城市 |
| 04 | 逐小时详情 | `pages/weather/hourly` | 气温/降水双曲线、逐时明细表 |
| 05 | 15 天趋势 | `pages/weather/trend` | 高低温双曲线、日出日落、逐日明细 |
| 06 | 空气质量 | `pages/weather/air-quality` | AQI 环形仪表、6 项污染物浓度、健康建议 |
| 07 | 生活指数 | `pages/weather/index-list` | 8 项指数双列卡片 |
| 08 | 降水雷达 | `pages/weather/radar` | 降水地图、时间轴滑杆、提示条 |

底部胶囊导航：**首页 / 趋势 / 指数 / 雷达**（4 项，激活项填主色）

---

## 二、色彩

| 用途 | 色值 | 场景 |
|------|------|------|
| 主色 | `#014DB2` | 主按钮、选中态、图表主色、数据强调 |
| 深蓝渐变 | `#014DB2 → #001645` | 首页 Hero、AQI 主卡、当前城市卡 |
| 优良 / 绿 | `#10B981` | AQI 优、指数「适宜 / 少发 / 低」 |
| 注意 / 橙 | `#F59E0B` | AQI 良、紫外线强、高温、晾晒一般 |
| 预警 / 红 | `#EF4444` | 空气质量重度污染、极端天气预警 |
| 画布底 | `#F5F7FA` | 页面背景（非纯白，避免冷硬） |
| 卡片 | `#FFFFFF` | 内容卡片、输入框 |
| 文字主 | `#0A1628` | 标题、正文 |
| 文字次 | `#6B7280` | 描述、辅助信息 |
| 文字弱 | `#9AA5B4` | 占位符、刻度、未激活 Tab |
| 描边 | `#EDEFF3` / `#D6D9DE` | 分隔线、输入框描边 |

**天气语义色**（图表与图标用）：晴 `#FFC53D`、多云 `#8FA8CE`、阴 `#C3CEDD`、雨 `#4A90E2`、雪 `#5AA9E6`、雾 `#A9B4C4`、霾 `#C9A46A`、夜 `#E6EBF7`

---

## 三、字阶

| 角色 | 字号 | 字体 | 用途 |
|------|------|------|------|
| 主温度 | 88px | Inter Light | 首页大温度（唯一超大字） |
| AQI 数值 | 34px | Inter SemiBold | 空气质量页 |
| 页面标题 | 17px | Noto Sans SC SemiBold | 各页导航栏标题 |
| 卡片标题 | 16px | Noto Sans SC SemiBold | 模块标题 |
| 正文 | 13px | Noto Sans SC Regular | 描述、列表主文案 |
| 辅助 | 11px | Noto Sans SC Regular | 时间戳、单位、次要标签 |
| Tab 标签 | 10px | Noto Sans SC Medium | 底部导航，letter-spacing 0.5 |
| 指标数值 | 16px | Inter SemiBold | 玻璃指标卡四栏 |

字体族分工：**Inter** 管数字与英文，**Noto Sans SC** 管中文。

---

## 四、圆角与间距

| 圆角 | 用途 |
|------|------|
| 36px | 底部胶囊导航、胶囊标签 |
| 22px | 内容主卡片 |
| 20px | 特色卡片（当前城市卡、指数卡） |
| 16px | 提示条、输入框、小卡 |
| 14px | 搜索框、胶囊按钮 |
| 12px | 城市标签、小方块 |

| 间距 | 用途 |
|------|------|
| 4px | 图标与文字微调 |
| 8px | 图标内部元素 |
| 12px | 卡片内元素间距 |
| 16px | **页面左右边距（全局统一）** |
| 24px | 模块之间（规范板留白） |

---

## 五、关键组件

### 玻璃指标卡（首页 Hero 内）
- 填充：`rgba(255,255,255,0.18)`，`backdrop-filter: blur(24px)`
- 圆角 22px，内距 12×14
- 四栏：湿度 / 风力 / 降水概率 / 气压，标签 11px 白 70%，数值 16px SemiBold 纯白

### 底部胶囊导航
- 高度 62px，圆角 36px，1px 描边 `#E6EBF1`，阴影 `0 8px 24px rgba(0.02,0.09,0.16,0.10)`
- 内距 4px，四项等宽，激活项填 `#014DB2`（圆角 26px），图标 18px，标签 10px
- 容器内距：上 12px，左右 21px，下 21px（兼容全面屏安全区）

### 卡片
- 圆角 22px，内距 16px，阴影 `0 6px 18px rgba(0.02,0.09,0.16,0.06)`
- 标题行左标题右操作（副标题 12px `#014DB2`）

### 天气图标
- 统一 24×24 viewBox，描边 1.6px
- 9 个可复用组件：晴 / 多云 / 阴 / 雨 / 小雨 / 雪 / 雾 / 霾 / 夜

---

## 六、uni-app 实现要点

1. **单位换算**：375 设计稿 → 750rpx，1px ≈ 2rpx
2. **渐变背景**：`background-image: linear-gradient(180deg, #014DB2 0%, #001645 100%)`
3. **玻璃卡片**：`background: rgba(255,255,255,0.18)` + `backdrop-filter: blur(24px)`（小程序端注意兼容，可降级为半透明纯色）
4. **TabBar**：用自定义胶囊组件替代原生 `tabBar`，激活项填主色
5. **折线图**：canvas 或 uCharts 绘制；SVG 图标需转 base64 内联
6. **天气图标**：建议转 iconfont 或 PNG 雪碧图，避免多 SVG 请求
7. **安全区**：底部留 34rpx 胶囊导航高度 + 21rpx 安全区
8. **状态栏**：首页 Hero 为深色背景（白图标），其余页为浅色（深图标）

---

## 七、数据接口建议

前端只负责展示，数值与状态全部由服务端返回。**接口选型与实测结论见同目录 `接口选型方案.md`**。

推荐组合：**Open-Meteo**（主数据，免 Key）+ **RainViewer**（雷达，免 Key）+ **本地城市库**（china-area-data）。

```json
{
  "city": { "id": "330100", "name": "杭州市", "district": "西湖区" },
  "current": {
    "temp": 23, "feelsLike": 25, "high": 26, "low": 18,
    "condition": "多云转晴", "conditionCode": "CLOUDY_TO_CLEAR",
    "humidity": 65, "windDir": "东南风", "windScale": 3,
    "pressure": 1013, "precipProbability": 10, "aqi": 42
  },
  "hourly": [{ "time": "14:00", "temp": 23, "feelsLike": 25, "icon": "cloudy", "precipProbability": 10 }],
  "daily":  [{ "date": "10-28", "weekday": "周三", "icon": "cloudy", "condition": "多云", "high": 26, "low": 18, "sunrise": "05:42", "sunset": "18:36" }],
  "airQuality": { "aqi": 42, "level": "优", "items": [{ "key": "PM2.5", "value": 12, "unit": "μg/m³", "level": "优" }] },
  "indices":  [{ "key": "dressing", "name": "穿衣", "level": "舒适", "advice": "建议穿薄外套", "icon": "shirt" }],
  "radar":    { "frames": [{ "time": "14:00", "image": "..." }], "legend": ["小雨", "中雨", "大雨"] }
}
```

### 图标字段取值（对应图标库 11 个组件）
`sunny` · `cloudy` · `overcast` · `rain` · `lightRain` · `snow` · `fog` · `haze` · `night` · `thunder` · `sleet`

WMO weather_code → 图标的完整映射表见 `接口选型方案.md` §七。

---

## 八、设计稿文件结构（Ardot 画布）

```
01 · 首页 · 当前天气    02 · 城市搜索    03 · 城市管理    04 · 逐小时详情
05 · 多日趋势          06 · 空气质量    07 · 生活指数    08 · 降水雷达
─────────────────────────────────────────────────────────────────
设计系统 · 天气图标库    设计系统 · 导航与组件    设计系统 · 规范总览
```
