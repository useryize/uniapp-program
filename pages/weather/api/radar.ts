/**
 * @file 降水雷达数据源（RainViewer）
 *
 * 免费免 Key，全球雷达拼图，10 分钟一帧。
 * 实测：weather-maps.json 返回 13 帧 past，nowcast 数组为空（需优雅降级）。
 *
 * ⚠️ 三个约束：
 * 1. path 是短生命周期的哈希，**必须每 3–5 分钟重拉清单**，不能缓存 path
 * 2. 免费条款强制要求署名「Weather data by RainViewer」
 * 3. 瓦片只画回波，不含底图
 */

import { get, getCached } from './http'

const MANIFEST = 'https://api.rainviewer.com/public/weather-maps.json'
const TTL = 3 * 60 * 1000

/**
 * 取雷达帧清单
 * @returns {Promise<{host:string, frames:Array<{time:number,path:string,url:string}>}>}
 */
export async function fetchRadarFrames() {
  const data = await getCached(MANIFEST, 'wx_radar_manifest', TTL)
  const host = data.host || 'https://tilecache.rainviewer.com'
  const past = data?.radar?.past || []
  const nowcast = data?.radar?.nowcast || []

  const frames = [...past, ...nowcast].map((f) => ({
    time: f.time,
    path: f.path,
    // 单帧 URL 模板：{host}{path}/{size}/{z}/{x}/{y}/{color}/{options}.png
    urlTemplate: `${host}${f.path}`
  }))

  return { host, frames }
}

/**
 * 构造指定位置的雷达瓦片 URL
 * @param {string} host tilecache 主机
 * @param {string} path 帧路径
 * @param {number} lng 经度
 * @param {number} lat 纬度
 * @param {number} zoom 缩放级别（RainViewer 最大 7）
 * @param {number} [size=256] 瓦片尺寸
 * @returns {string}
 */
export function tileUrl(host, path, lng, lat, zoom, size = 256) {
  const n = Math.pow(2, zoom)
  const x = Math.floor(((lng + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  )
  return `${host}${path}/${size}/${zoom}/${x}/${y}/4/1_1.png`
}

/**
 * 计算覆盖指定中心的瓦片块（用于地图平铺）
 * @param {string} host 主机
 * @param {string} path 帧路径
 * @param {number} lng 中心经度
 * @param {number} lat 中心纬度
 * @param {number} zoom 缩放级别
 * @param {number} [radius=2] 半径（覆盖 2r+1 见方）
 * @returns {Array<{url:string, left:number, top:number}>} left/top 为相对中心的像素偏移
 */
export function tileCluster(host, path, lng, lat, zoom, radius = 2) {
  const size = 256
  const n = Math.pow(2, zoom)
  const cx = Math.floor(((lng + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const cy = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  )
  const out = []
  for (let dx = -radius; dx <= radius; dx += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      const x = cx + dx
      const y = cy + dy
      if (y < 0 || y >= n) continue
      // 瓦片中心相对地图中心的像素偏移
      const left = (x - cx) * size
      const top = (y - cy) * size
      out.push({
        url: `${host}${path}/${size}/${zoom}/${x}/${y}/4/1_1.png`,
        left,
        top
      })
    }
  }
  return out
}

/**
 * 判断当前是否已有预报帧（RainViewer nowcast 可能为空）
 * @param {Object} radar fetchRadarFrames 的结果
 * @returns {boolean}
 */
export function hasForecast(radar) {
  return !!(radar && radar.frames && radar.frames.length > 0)
}

/**
 * 探测雷达可用性（用于降级提示）
 * @returns {Promise<boolean>}
 */
export async function probeRadar() {
  try {
    const data = await get(MANIFEST, { timeout: 8000, retries: 0 })
    return !!(data && data.host)
  } catch (e) {
    return false
  }
}
