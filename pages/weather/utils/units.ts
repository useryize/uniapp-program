/**
 * @file 单位换算与数值格式化
 *
 * 覆盖设计稿中所有"接口原始值 → 展示值"的转换：
 * - 风速 km/h → 蒲福风级（设计稿显示"东南风 3级"）
 * - AQI 标准选择与分级
 * - 温度 / 降水 / 时间的展示格式
 */

/** 蒲福风级：按 m/s 上限查表 */
const BEAUFORT = [
  { max: 0.3, level: 0, name: '无风' },
  { max: 1.6, level: 1, name: '软风' },
  { max: 3.4, level: 2, name: '轻风' },
  { max: 5.5, level: 3, name: '微风' },
  { max: 8.0, level: 4, name: '和风' },
  { max: 10.8, level: 5, name: '清劲风' },
  { max: 13.9, level: 6, name: '强风' },
  { max: 17.2, level: 7, name: '疾风' },
  { max: 20.8, level: 8, name: '大风' },
  { max: 24.5, level: 9, name: '烈风' },
  { max: 28.5, level: 10, name: '狂风' },
  { max: 32.7, level: 11, name: '暴风' },
  { max: Infinity, level: 12, name: '飓风' }
]

/**
 * km/h → 风力等级
 * @param {number} kmh 风速 km/h
 * @returns {{level:number, name:string, text:string}}
 */
export function windScale(kmh) {
  if (kmh == null) return { level: 0, name: '无风', text: '无风' }
  const ms = kmh / 3.6
  const hit = BEAUFORT.find((b) => ms <= b.max) || BEAUFORT[BEAUFORT.length - 1]
  return { level: hit.level, name: hit.name, text: `${hit.level}级` }
}

/**
 * 风向角度 → 中文方位
 * @param {number} deg 风向角度（0 = 北，顺时针）
 * @returns {string} 如「东南风」
 */
export function windDirection(deg) {
  if (deg == null) return '微风'
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  // 八方位扇区：每个方位占 45°，以扇区中点为界（22.5 / 67.5 / 112.5 …）
  const norm = ((deg % 360) + 360) % 360
  const idx = Math.floor((norm + 22.5) / 45) % 8
  return `${dirs[idx]}风`
}

/**
 * AQI 分级（中国标准 HJ 633-2012）
 * @param {number} aqi AQI 数值
 * @returns {{level:string, color:string, advice:string}}
 */
export function aqiLevel(aqi) {
  if (aqi == null) return { level: '—', color: '#9AA5B4', advice: '暂无数据' }
  if (aqi <= 50) {
    return { level: '优', color: '#10B981', advice: '空气质量令人满意，可正常户外活动' }
  }
  if (aqi <= 100) {
    return { level: '良', color: '#84CC16', advice: '空气质量可接受，极少数敏感人群应减少户外活动' }
  }
  if (aqi <= 150) {
    return { level: '轻度污染', color: '#F59E0B', advice: '儿童、老年人及心脏病、呼吸系统疾病患者应减少长时间户外锻炼' }
  }
  if (aqi <= 200) {
    return { level: '中度污染', color: '#F97316', advice: '敏感人群避免户外活动，一般人群适量减少户外运动' }
  }
  if (aqi <= 300) {
    return { level: '重度污染', color: '#EF4444', advice: '建议停止户外活动，待在家中并保持室内空气流通' }
  }
  return { level: '严重污染', color: '#B91C1C', advice: '健康人群普遍出现症状，应避免户外活动并做好防护' }
}

/**
 * 污染物分项等级（按国标 GB 3095-2012 一级 24 小时平均限值折算）
 *
 * ⚠️ 单位口径注意：接口统一返回 μg/m³，但 CO 的国标限值是 4 mg/m³，
 *    需先除以 1000 再比，否则 CO 会永远显示「超标」。
 *
 * @param {string} key 污染物键
 * @param {number} value 浓度 μg/m³
 * @returns {{level:string, color:string, ratio:number}} ratio 为 0–1 的进度比例
 */
export function pollutantLevel(key, value) {
  if (value == null) return { level: '—', color: '#9AA5B4', ratio: 0 }
  // 24 小时平均限值（μg/m³）；CO 单独标注其 mg/m³ 口径
  const limits = {
    pm25: 35,
    pm10: 70,
    o3: 160,
    no2: 40,
    so2: 40,
    co: 4000 // 4 mg/m³ = 4000 μg/m³
  }
  const limit = limits[key] || 100
  // 保留原始比例用于判级，进度条展示再截断到 1
  const raw = value / limit
  const ratio = Math.min(1, raw)
  let level = '优'
  let color = '#10B981'
  if (raw > 1) {
    level = '超标'
    color = '#EF4444'
  } else if (raw > 0.7) {
    level = '良'
    color = '#84CC16'
  } else if (raw > 0.4) {
    level = '轻度污染'
    color = '#F59E00'
  }
  return { level, color, ratio }
}

/**
 * 温度格式化（取整，带符号）
 * @param {number} t 温度
 * @returns {string} 如「-3°」
 */
export function formatTemp(t) {
  if (t == null) return '--°'
  return `${Math.round(t)}°`
}

/**
 * 温度区间格式化
 * @param {number} max 最高温
 * @param {number} min 最低温
 * @returns {string} 如「26°/18°」
 */
export function formatTempRange(max, min) {
  if (max == null || min == null) return '--/--°'
  return `${Math.round(max)}°/${Math.round(min)}°`
}

/**
 * 相对时间（用于雷达帧：现在 / +30分 / +1小时）
 * @param {number} ts Unix 时间戳（秒）
 * @returns {string}
 */
export function relativeTime(ts) {
  if (!ts) return ''
  const diff = Math.round((ts * 1000 - Date.now()) / 60000)
  if (diff <= 0) return '现在'
  if (diff < 60) return `+${diff}分`
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return m ? `+${h}时${m}分` : `+${h}小时`
}

/**
 * 从 ISO 时间串中取「HH:mm」
 * @param {string} iso ISO8601 时间串
 * @returns {string}
 */
export function isoTime(iso) {
  if (!iso) return ''
  const m = String(iso).match(/T(\d{2}):(\d{2})/)
  return m ? `${m[1]}:${m[2]}` : ''
}

/**
 * 从 ISO 时间串中取「MM-DD」
 * @param {string} iso ISO8601 时间串
 * @returns {string}
 */
export function isoDate(iso) {
  if (!iso) return ''
  // 日期段在 T 之前：2026-10-28T14:30 → 取 10-28
  const m = String(iso).match(/^\d{4}-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}` : ''
}

/**
 * 星期几
 * @param {string} iso ISO8601 日期串
 * @returns {string} 如「周三」
 */
export function isoWeekday(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
}

/**
 * 紫外线分级
 * @param {number} uv uv_index
 * @returns {{level:string, color:string, advice:string}}
 */
export function uvLevel(uv) {
  if (uv == null) return { level: '—', color: '#9AA5B4', advice: '暂无数据' }
  if (uv < 3) return { level: '弱', color: '#10B981', advice: '紫外线较弱，午后外出无需特别防晒' }
  if (uv < 6) return { level: '中等', color: '#84CC16', advice: '外出建议涂抹防晒霜，戴遮阳帽' }
  if (uv < 8) return { level: '强', color: '#F59E0B', advice: '正午前后避免暴晒，使用 SPF30+ 防晒' }
  if (uv < 11) return { level: '很强', color: '#F97316', advice: '减少户外活动，10 点前或 16 点后出门' }
  return { level: '极强', color: '#EF4444', advice: '避免户外活动，做好全面防晒防护' }
}
