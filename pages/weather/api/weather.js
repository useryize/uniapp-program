/**
 * @file 天气数据适配器 —— 把 Open-Meteo 原始响应转成设计稿约定的 JSON 结构
 *
 * 职责：
 * 1. 发起 Open-Meteo 预报 / 空气质量请求（合并为一次请求，减少额度消耗）
 * 2. WMO weather_code → 中文文案 + 图标键
 * 3. 单位换算（km/h → 风力等级、μg/m³ AQI 分级）
 * 4. 生活指数自算（Open-Meteo 无此数据）
 * 5. 缓存：实况 10min / 逐时 30min / 逐日 2h / 空气质量 30min
 *
 * 输出结构与 docs/UI设计规范.md §七 一致。
 */

import { getCached } from './http'
import { resolveWmo, isHaze } from '../utils/wmo'
import {
  windScale,
  windDirection,
  aqiLevel,
  pollutantLevel,
  formatTemp,
  formatTempRange,
  isoTime,
  isoDate,
  isoWeekday
} from '../utils/units'
import { calcIndices } from '../utils/indices'

const FORECAST_API = 'https://api.open-meteo.com/v1/forecast'
const AIR_API = 'https://air-quality-api.open-meteo.com/v1/air-quality'

/** 缓存有效期（毫秒） */
const TTL = {
  current: 10 * 60 * 1000,
  hourly: 30 * 60 * 1000,
  daily: 2 * 60 * 60 * 1000,
  air: 30 * 60 * 1000
}

/** 请求字段：一次拿全，摊薄调用成本 */
const CURRENT_VARS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'precipitation',
  'weather_code',
  'surface_pressure',
  'wind_speed_10m',
  'wind_direction_10m',
  'is_day'
].join(',')

const HOURLY_VARS = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation_probability',
  'weather_code',
  'uv_index',
  'is_day'
].join(',')

const DAILY_VARS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'sunrise',
  'sunset',
  'uv_index_max',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max'
].join(',')

const AIR_VARS = [
  'pm10',
  'pm2_5',
  'carbon_monoxide',
  'nitrogen_dioxide',
  'sulphur_dioxide',
  'ozone',
  'us_aqi'
].join(',')

/**
 * 构造预报请求 URL
 * @param {number} lat 纬度
 * @param {number} lng 经度
 * @returns {string}
 */
function forecastUrl(lat, lng) {
  const q = [
    `latitude=${lat}`,
    `longitude=${lng}`,
    `current=${CURRENT_VARS}`,
    `hourly=${HOURLY_VARS}`,
    `daily=${DAILY_VARS}`,
    'timezone=Asia%2FShanghai',
    'forecast_days=16',
    'wind_speed_unit=kmh'
  ].join('&')
  return `${FORECAST_API}?${q}`
}

/**
 * 构造空气质量请求 URL
 * @param {number} lat 纬度
 * @param {number} lng 经度
 * @returns {string}
 */
function airUrl(lat, lng) {
  const q = [
    `latitude=${lat}`,
    `longitude=${lng}`,
    `current=${AIR_VARS}`,
    'timezone=Asia%2FShanghai'
  ].join('&')
  return `${AIR_API}?${q}`
}

/**
 * 取当前小时在 hourly 数组中的起始下标
 * @param {Array<string>} times ISO 时间数组
 * @returns {number}
 */
function currentHourIndex(times) {
  if (!times || !times.length) return 0
  const now = new Date()
  const nowHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
  for (let i = 0; i < times.length; i += 1) {
    if (new Date(times[i]) >= nowHour) return i
  }
  return 0
}

/**
 * 组装逐时数组（从当前小时起 24 条）
 * @param {Object} hourly Open-Meteo hourly 对象
 * @returns {Array<Object>}
 */
function buildHourly(hourly) {
  if (!hourly || !hourly.time) return []
  const start = currentHourIndex(hourly.time)
  const out = []
  // 安全取值：接口理论上返回等长数组，这里做防御性访问避免越界
  const at = (arr, i) => (Array.isArray(arr) ? arr[i] : undefined)
  for (let i = start; i < Math.min(start + 24, hourly.time.length); i += 1) {
    // 昼夜用接口的 is_day（按真实日出日落计算），不用下标近似
    const isDay = at(hourly.is_day, i) !== 0
    const wmo = resolveWmo(at(hourly.weather_code, i), isDay)
    out.push({
      time: isoTime(hourly.time[i]),
      iso: hourly.time[i],
      // 跨天标记：与首条不同日期则为次日（04 页表格需要区分）
      dayOffset: i === start ? 0 : dateDiff(hourly.time[i], hourly.time[start]),
      temp: at(hourly.temperature_2m, i) ?? null,
      feelsLike: at(hourly.apparent_temperature, i) ?? null,
      precipProbability: at(hourly.precipitation_probability, i) ?? 0,
      code: at(hourly.weather_code, i) ?? null,
      condition: wmo.text,
      icon: wmo.icon,
      uv: at(hourly.uv_index, i) ?? 0
    })
  }
  return out
}

/**
 * 计算两个 ISO 时间相差的天数
 * @param {string} a 较晚
 * @param {string} b 基准
 * @returns {number}
 */
function dateDiff(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return 0
  return Math.round((da - db) / 86400000)
}

/**
 * 组装逐日数组
 * @param {Object} daily Open-Meteo daily 对象
 * @returns {Array<Object>}
 */
function buildDaily(daily) {
  if (!daily || !daily.time) return []
  const at = (arr, i) => (Array.isArray(arr) ? arr[i] : undefined)
  return daily.time.map((t, i) => {
    const wmo = resolveWmo(at(daily.weather_code, i), true)
    return {
      date: isoDate(t),
      iso: t,
      weekday: isoWeekday(t),
      code: at(daily.weather_code, i) ?? null,
      condition: wmo.text,
      icon: wmo.icon,
      high: at(daily.temperature_2m_max, i) ?? null,
      low: at(daily.temperature_2m_min, i) ?? null,
      sunrise: isoTime(at(daily.sunrise, i)),
      sunset: isoTime(at(daily.sunset, i)),
      uvMax: at(daily.uv_index_max, i) ?? 0,
      precipSum: at(daily.precipitation_sum, i) ?? 0,
      precipProb: at(daily.precipitation_probability_max, i) ?? 0,
      windMax: at(daily.wind_speed_10m_max, i) ?? 0
    }
  })
}

/**
 * 组装空气质量对象
 * @param {Object} air Open-Meteo air-quality 响应
 * @param {number} humidity 当前湿度（用于霾判定）
 * @returns {Object}
 */
function buildAirQuality(air, humidity) {
  const c = air?.current || {}
  const pm25 = c.pm2_5 ?? null
  const aqi = c.us_aqi ?? null
  const meta = aqiLevel(aqi)
  const haze = isHaze(humidity, pm25)

  const items = [
    { key: 'pm25', name: 'PM2.5', value: pm25 },
    { key: 'pm10', name: 'PM10', value: c.pm10 ?? null },
    { key: 'o3', name: 'O₃', value: c.ozone ?? null },
    { key: 'no2', name: 'NO₂', value: c.nitrogen_dioxide ?? null },
    { key: 'so2', name: 'SO₂', value: c.sulphur_dioxide ?? null },
    { key: 'co', name: 'CO', value: c.carbon_monoxide ?? null }
  ].map((it) => {
    const lv = pollutantLevel(it.key, it.value)
    return { ...it, level: lv.level, color: lv.color, ratio: lv.ratio }
  })

  return {
    aqi,
    level: haze ? '霾' : meta.level,
    color: haze ? '#C9A46A' : meta.color,
    advice: haze ? '能见度偏低，敏感人群请减少户外活动' : meta.advice,
    updatedAt: isoTime(c.time),
    pm25,
    items
  }
}

/**
 * 取城市完整天气数据
 * @param {Object} city 城市对象 { adcode, name, short, lng, lat }
 * @returns {Promise<Object>} 设计稿约定的数据结构
 */
export async function fetchWeather(city) {
  if (!city || city.lng == null || city.lat == null) {
    throw Object.assign(new Error('城市坐标缺失'), { code: -2, msg: '城市坐标缺失' })
  }
  const { lat, lng } = city
  const key = `wx_fc_${city.adcode || `${lat},${lng}`}`

  // 预报与空气质量并行请求；空气质量失败不阻塞主流程
  const [fc, air] = await Promise.all([
    getCached(forecastUrl(lat, lng), `${key}_fc`, TTL.hourly),
    getCached(airUrl(lat, lng), `${key}_air`, TTL.air).catch(() => null)
  ])

  const cur = fc.current || {}
  const daily = buildDaily(fc.daily)
  const hourly = buildHourly(fc.hourly)
  const humidity = cur.relative_humidity_2m ?? 0
  const airQuality = buildAirQuality(air, humidity)

  // 霾覆盖：Open-Meteo 无霾码，用组合判定修正图标
  // 注意用局部变量承接，不改写 fc.current（它可能被缓存层持有）
  let currentCode = cur.weather_code
  if (airQuality.level === '霾') {
    const wmo = resolveWmo(currentCode, cur.is_day !== 0)
    if (wmo.icon === 'sunny' || wmo.icon === 'cloudy') {
      currentCode = 45
    }
  }

  const wmo = resolveWmo(currentCode, cur.is_day !== 0)
  const wind = windScale(cur.wind_speed_10m)
  const dir = windDirection(cur.wind_direction_10m)
  const today = daily[0] || {}

  // 24h 降水汇总（用于生活指数）
  const next24 = hourly.slice(0, 24)
  const precipSum24 = next24.reduce((s, h) => s + (h.precipProbability >= 50 ? 0.5 : 0), 0)
  const precipProb24 = next24.length ? Math.max(...next24.map((h) => h.precipProbability || 0)) : 0
  const uvMax = today.uvMax ?? 0
  const windMax = today.windMax ?? cur.wind_speed_10m ?? 0

  return {
    city: {
      id: String(city.adcode || ''),
      name: city.name || city.short || '',
      short: city.short || city.name || '',
      province: city.province || '',
      lng,
      lat
    },
    current: {
      temp: cur.temperature_2m,
      tempText: formatTemp(cur.temperature_2m),
      feelsLike: cur.apparent_temperature,
      feelsText: formatTemp(cur.apparent_temperature),
      high: today.high,
      low: today.low,
      highText: formatTemp(today.high),
      lowText: formatTemp(today.low),
      rangeText: formatTempRange(today.high, today.low),
      condition: wmo.text,
      icon: wmo.icon,
      code: currentCode,
      humidity,
      windDir: dir,
      windScale: wind.level,
      windText: `${dir} ${wind.level}级`,
      pressure: cur.surface_pressure,
      precipProbability: precipProb24,
      precip: cur.precipitation,
      isDay: cur.is_day !== 0,
      aqi: airQuality.aqi,
      updatedAt: isoTime(cur.time)
    },
    hourly,
    daily,
    airQuality,
    indices: calcIndices({
      feels: cur.apparent_temperature ?? 20,
      high: today.high ?? 25,
      low: today.low ?? 15,
      humidity,
      precipSum: precipSum24,
      precipProb: precipProb24,
      uvMax,
      windMax
    }),
    tips: buildTips({ wmo, temp: cur.temperature_2m, humidity, airQuality, precipProb: precipProb24, wind }),
  }
}

/**
 * 生成今日提示文案
 * @param {Object} p 参数
 * @returns {string}
 */
function buildTips({ wmo, temp, humidity, airQuality, precipProb, wind }) {
  const parts = []
  if (precipProb >= 60) parts.push('降水概率较高，出门记得带伞')
  else if (precipProb >= 30) parts.push('可能有零星降水，建议随身带伞')

  if (temp >= 30) parts.push('午后高温，注意防暑降温')
  else if (temp <= 5) parts.push('早晚较冷，注意保暖')

  if (airQuality.aqi != null && airQuality.aqi > 100) parts.push('空气质量欠佳，敏感人群减少户外活动')

  if (wind.level >= 6) parts.push('风力较大，注意出行安全')

  if (humidity >= 85) parts.push('湿度较高，体感闷热')

  if (!parts.length) {
    parts.push(wmo.icon === 'sunny' ? '天气晴好，适合户外活动' : '天气状况良好，适宜出行')
  }
  return parts.slice(0, 2).join('；')
}
