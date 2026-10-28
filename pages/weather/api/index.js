/**
 * @file 天气模块接口层统一出口
 *
 * 架构规则（对齐 mall 模块 api/index.js）：
 * 1. 页面只 import 本文件，禁止直接 import http / weather / radar
 * 2. 统一解包：成功 resolve 纯数据，失败 reject { code, msg }
 * 3. 新增接口在此登记，页面不感知底层来源
 */

import { fetchWeather } from './weather'
import { fetchRadarFrames, tileCluster, tileUrl, probeRadar } from './radar'
import {
  loadCities,
  searchCities,
  getCityByAdcode,
  getHotCities,
  getCitiesByProvince
} from './city'

/** 已添加城市与当前城市的本地存储键 */
const STORAGE_CITIES = 'wx_city_list'
const STORAGE_CURRENT = 'wx_current_city'

/**
 * 读取已添加城市列表
 * @returns {Array<Object>}
 */
export function getSavedCities() {
  try {
    const raw = uni.getStorageSync(STORAGE_CITIES)
    if (!raw) return []
    const list = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(list) ? list : []
  } catch (e) {
    return []
  }
}

/**
 * 保存已添加城市列表
 * @param {Array<Object>} list 城市列表
 */
export function saveSavedCities(list) {
  try {
    uni.setStorageSync(STORAGE_CITIES, JSON.stringify(list || []))
  } catch (e) {
    // 忽略存储失败
  }
}

/**
 * 读取当前城市（无则返回默认杭州）
 * @returns {Object}
 */
export function getCurrentCity() {
  try {
    const raw = uni.getStorageSync(STORAGE_CURRENT)
    if (raw) {
      const c = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (c && c.lat != null) return c
    }
  } catch (e) {
    // 回落到默认城市
  }
  const fallback = getCityByAdcode('330100')
  return (
    fallback || {
      adcode: '330100',
      name: '杭州市',
      short: '杭州',
      province: '浙江省',
      lng: 120.1536,
      lat: 30.2875
    }
  )
}

/**
 * 设置当前城市
 * @param {Object} city 城市对象
 */
export function setCurrentCity(city) {
  try {
    uni.setStorageSync(STORAGE_CURRENT, JSON.stringify(city))
  } catch (e) {
    // 忽略存储失败
  }
}

/**
 * 添加城市到已添加列表（去重）
 * @param {Object} city 城市对象
 * @returns {Array<Object>} 更新后的列表
 */
export function addCity(city) {
  const list = getSavedCities()
  // adcode 统一按字符串比较，兼容历史存储的数字类型
  if (!list.some((c) => String(c.adcode) === String(city.adcode))) {
    list.push({ ...city, adcode: String(city.adcode) })
    saveSavedCities(list)
  }
  setCurrentCity(city)
  return list
}

/**
 * 移除城市
 * @param {string|number} adcode 行政区划代码
 * @returns {Array<Object>} 更新后的列表
 */
export function removeCity(adcode) {
  const list = getSavedCities().filter((c) => String(c.adcode) !== String(adcode))
  saveSavedCities(list)
  return list
}

/**
 * 调整城市顺序（拖拽排序）
 * @param {number} from 原下标
 * @param {number} to 目标下标
 * @returns {Array<Object>} 更新后的列表
 */
export function moveCity(from, to) {
  const list = getSavedCities()
  if (from < 0 || from >= list.length) return list
  const [item] = list.splice(from, 1)
  list.splice(to, 0, item)
  saveSavedCities(list)
  return list
}

/**
 * 获取天气数据
 * @param {Object} city 城市对象
 * @returns {Promise<Object>} 设计稿约定的数据结构
 */
export function getWeather(city) {
  return fetchWeather(city)
}

/**
 * 获取雷达帧
 * @returns {Promise<{host:string, frames:Array}>}
 */
export function getRadarFrames() {
  return fetchRadarFrames()
}

/**
 * 构造雷达瓦片
 * @param {string} host 主机
 * @param {string} path 帧路径
 * @param {number} lng 经度
 * @param {number} lat 纬度
 * @param {number} zoom 缩放
 * @param {number} [radius] 半径
 * @returns {Array<{url:string,left:number,top:number}>}
 */
export function getRadarTiles(host, path, lng, lat, zoom, radius) {
  return tileCluster(host, path, lng, lat, zoom, radius)
}

/**
 * 构造单张雷达瓦片 URL
 */
export function getRadarTileUrl(host, path, lng, lat, zoom) {
  return tileUrl(host, path, lng, lat, zoom)
}

/**
 * 探测雷达可用性
 * @returns {Promise<boolean>}
 */
export function checkRadar() {
  return probeRadar()
}

/**
 * 搜索城市
 * @param {string} keyword 关键词
 * @param {number} [limit] 条数
 * @returns {Array<Object>}
 */
export function findCities(keyword, limit) {
  return searchCities(keyword, limit)
}

/**
 * 热门城市
 * @param {number} [limit] 条数
 * @returns {Array<Object>}
 */
export function hotCities(limit) {
  return getHotCities(limit)
}

/**
 * 按 adcode 查城市
 * @param {string|number} adcode 代码
 * @returns {Object|null}
 */
export function cityByAdcode(adcode) {
  return getCityByAdcode(adcode)
}

/**
 * 按省取城市
 * @param {string} province 省名
 * @returns {Array<Object>}
 */
export function citiesOfProvince(province) {
  return getCitiesByProvince(province)
}

/**
 * 初始化城市库（预热）
 */
export function initCityDb() {
  return loadCities()
}

/**
 * 默认导出：页面统一 `import weatherApi from '../api'` 引入
 */
export default {
  // 城市
  getCurrentCity,
  setCurrentCity,
  getSavedCities,
  saveSavedCities,
  addCity,
  removeCity,
  moveCity,
  findCities,
  hotCities,
  cityByAdcode,
  citiesOfProvince,
  initCityDb,
  // 天气
  getWeather,
  // 雷达
  getRadarFrames,
  getRadarTiles,
  getRadarTileUrl,
  checkRadar
}
