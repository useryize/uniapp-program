/**
 * @file 城市数据源（本地静态库 + 搜索）
 *
 * 为什么不用 Open-Meteo 地理编码：实测搜「杭州」会返回四川甘孜同名地（歧义）。
 * 故采用 DataV 行政区划中心点构建的本地静态库（367 个地级市 + 直辖市），
 * 运行时零网络请求，搜索支持中文名 / 拼音首字母 / 全拼。
 *
 * 数据文件：data/cities.json（52KB，构建期由 scripts 生成）
 */

let CITIES = []
let INDEX = null

/**
 * 城市数据（构建期由 scripts/ 生成，编译时内联进产物）
 * 用静态 import 而非 require —— 小程序端 require 运行时不参与打包；
 * 存为 .js 而非 .json —— JSON import 在小程序端与 Node ESM 行为不一致
 */
import { CITY_DATA } from '../data/cities.js'

/**
 * 加载城市库（首次调用时建索引）
 * @returns {Array<Object>} 城市列表
 */
export function loadCities() {
  if (CITIES.length) return CITIES
  try {
    const raw = (CITY_DATA && CITY_DATA.cities) || []
    // 统一 adcode 为字符串 —— 数据源是数字，而存储/比较链路用字符串
    CITIES = raw.map((c) => ({ ...c, adcode: String(c.adcode) }))
    buildIndex()
  } catch (e) {
    CITIES = []
  }
  return CITIES
}

/** 构建检索索引：名称 / 拼音首字母 / 全拼 → 城市 */
function buildIndex() {
  INDEX = { name: {}, py: {}, pyFull: {} }
  CITIES.forEach((c) => {
    const keys = [c.name, c.short]
    keys.forEach((k) => {
      if (k) INDEX.name[k] = c
    })
    if (c.py) INDEX.py[c.py] = c
    if (c.pyFull) INDEX.pyFull[c.pyFull] = c
  })
}

/**
 * 搜索城市
 * @param {string} keyword 关键词（中文名 / 拼音首字母 / 全拼）
 * @param {number} [limit=20] 返回条数
 * @returns {Array<Object>} 匹配城市
 */
export function searchCities(keyword, limit = 20) {
  loadCities()
  if (!keyword) return []
  const kw = String(keyword).trim().toLowerCase()
  if (!kw) return []

  const result = []
  const seen = new Set()

  const push = (c) => {
    if (!c || seen.has(c.adcode)) return
    seen.add(c.adcode)
    result.push(c)
  }

  // 1. 完全匹配优先
  if (INDEX.name[kw]) push(INDEX.name[kw])
  if (INDEX.py[kw]) push(INDEX.py[kw])
  if (INDEX.pyFull[kw]) push(INDEX.pyFull[kw])

  // 2. 前缀匹配
  CITIES.forEach((c) => {
    if (result.length >= limit) return
    if (
      c.short.startsWith(kw) ||
      c.name.startsWith(kw) ||
      c.py.startsWith(kw) ||
      c.pyFull.startsWith(kw)
    ) {
      push(c)
    }
  })

  // 3. 包含匹配
  if (result.length < limit) {
    CITIES.forEach((c) => {
      if (result.length >= limit) return
      if (c.short.includes(kw) || c.name.includes(kw) || c.pyFull.includes(kw)) {
        push(c)
      }
    })
  }

  return result.slice(0, limit)
}

/**
 * 按 adcode 精确查城市
 * @param {string|number} adcode 行政区划代码
 * @returns {Object|null}
 */
export function getCityByAdcode(adcode) {
  loadCities()
  return CITIES.find((c) => String(c.adcode) === String(adcode)) || null
}

/**
 * 热门城市（按直辖市 + 省会 + 一线城市）
 * 设计稿 02 页「热门城市」区块用
 */
const HOT_CODES = [
  '110000', '310000', '120000', '500000', // 直辖市
  '330100', '440100', '440300', '320100', '320500', // 沪杭深宁锡
  '510100', '420100', '610100', '370200', '370100', // 成都武汉西安青岛济南
  '210100', '230100', '120100', '320200', '350200', // 沈阳大连天津宁波厦门
  '460100', '460300', '650100', '540100', '640100', // 海口三亚乌鲁木齐拉萨银川
  '430100', '420500', '330200', '330300', '410100', // 长沙宜昌宁波温州郑州
  '360100', '340100', '140100', '530100', '620100' // 南昌合肥太原昆明兰州
]

/**
 * 热门城市列表
 * @param {number} [limit=12] 返回条数
 * @returns {Array<Object>}
 */
export function getHotCities(limit = 12) {
  loadCities()
  // adcode 在数据源中为数字，此处统一转字符串比较
  const list = HOT_CODES.map((code) =>
    CITIES.find((c) => String(c.adcode) === code)
  ).filter(Boolean)
  return list.slice(0, limit)
}

/**
 * 按省分组取城市（城市管理页可选的二级列表）
 * @param {string} province 省名
 * @returns {Array<Object>}
 */
export function getCitiesByProvince(province) {
  loadCities()
  return CITIES.filter((c) => c.province === province)
}
