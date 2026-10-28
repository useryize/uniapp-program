/**
 * @file WMO 天气码 → 中文文案 / 图标键 映射
 *
 * 数据源：Open-Meteo 返回 WMO Weather interpretation codes（0–99）
 * 图标键与设计稿图标库 11 个组件一一对应：
 *   sunny / cloudy / overcast / rain / lightRain / snow / fog / haze / night / thunder / sleet
 *
 * 依据：docs/接口选型方案.md §七「天气码映射表」
 */

/** WMO 码 → { text 中文, icon 图标键 } */
export const WMO_MAP = {
  0: { text: '晴', icon: 'sunny' },
  1: { text: '大部晴朗', icon: 'sunny' },
  2: { text: '多云', icon: 'cloudy' },
  3: { text: '阴', icon: 'overcast' },
  45: { text: '有雾', icon: 'fog' },
  48: { text: '雾凇', icon: 'fog' },
  51: { text: '小毛毛雨', icon: 'lightRain' },
  53: { text: '毛毛雨', icon: 'lightRain' },
  55: { text: '浓毛毛雨', icon: 'rain' },
  56: { text: '冻毛毛雨', icon: 'sleet' },
  57: { text: '强冻毛毛雨', icon: 'sleet' },
  61: { text: '小雨', icon: 'lightRain' },
  63: { text: '中雨', icon: 'rain' },
  65: { text: '大雨', icon: 'rain' },
  66: { text: '冻雨', icon: 'sleet' },
  67: { text: '强冻雨', icon: 'sleet' },
  71: { text: '小雪', icon: 'snow' },
  73: { text: '中雪', icon: 'snow' },
  75: { text: '大雪', icon: 'snow' },
  77: { text: '雪粒', icon: 'snow' },
  80: { text: '小阵雨', icon: 'rain' },
  81: { text: '阵雨', icon: 'rain' },
  82: { text: '强阵雨', icon: 'rain' },
  85: { text: '小阵雪', icon: 'snow' },
  86: { text: '大阵雪', icon: 'snow' },
  95: { text: '雷阵雨', icon: 'thunder' },
  96: { text: '雷阵雨伴冰雹', icon: 'thunder' },
  99: { text: '强雷阵雨伴冰雹', icon: 'thunder' }
}

/**
 * 解析 WMO 码
 * @param {number} code WMO weather_code
 * @param {boolean} [isDay=true] 是否白天（夜间用 night 图标覆盖晴/多云）
 * @returns {{text:string, icon:string}}
 */
export function resolveWmo(code, isDay = true) {
  const hit = WMO_MAP[code] || WMO_MAP[3]
  // 夜间：晴天与多云换用月夜图标，其余保持不变
  if (!isDay && (hit.icon === 'sunny' || hit.icon === 'cloudy')) {
    return { text: hit.text, icon: 'night' }
  }
  return { ...hit }
}

/**
 * 判定是否为霾（Open-Meteo 无霾指数，用能见度 + 湿度 + PM 组合近似）
 * @param {number} humidity 相对湿度 %
 * @param {number} pm25 PM2.5 μg/m³
 * @returns {boolean}
 */
export function isHaze(humidity, pm25) {
  if (humidity == null || pm25 == null) return false
  // 高湿 + 低 PM + 弱风是霾的典型特征（区别于雾：雾是 100% 湿度）
  return humidity >= 75 && humidity < 95 && pm25 <= 75
}
