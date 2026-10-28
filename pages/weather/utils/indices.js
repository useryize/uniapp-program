/**
 * @file 生活指数自算（8 项）
 *
 * 背景：Open-Meteo 免费层不提供生活指数（实测确认），故按公开气象阈值推导。
 * 依据：docs/接口选型方案.md §四「方案 A：全部自算」
 *
 * 8 项：穿衣 / 紫外线 / 洗车 / 运动 / 感冒 / 晾晒 / 过敏 / 出行
 * 每项输出 { key, name, level, color, advice }，color 取设计稿语义色
 *
 * 说明：过敏指数以干燥度（湿度 + 温差）代理，非真实花粉浓度；
 *       穿衣/运动等文案参考气象行业通用表述，非官方发布口径。
 */

import { uvLevel } from './units'

/**
 * 穿衣指数：按体感温度分 6 档
 * @param {number} feels 体感温度 ℃
 * @param {number} diff 昼夜温差 ℃
 * @returns {{level:string, color:string, advice:string}}
 */
function calcDressing(feels, diff) {
  const t = feels
  let level
  let color
  let advice
  if (t >= 28) {
    level = '炎热'
    color = '#EF4444'
    advice = '短袖短裤，注意防暑降温'
  } else if (t >= 24) {
    level = '温暖'
    color = '#F59E0B'
    advice = '短袖或薄衬衫，早晚可加薄外套'
  } else if (t >= 18) {
    level = '舒适'
    color = '#10B981'
    advice = '建议穿薄外套，早晚加件开衫'
  } else if (t >= 12) {
    level = '凉爽'
    color = '#84CC16'
    advice = '建议穿长袖衬衫或薄卫衣'
  } else if (t >= 5) {
    level = '较冷'
    color = '#4C8DFF'
    advice = '建议穿夹克或毛衣，注意早晚保暖'
  } else {
    level = '寒冷'
    color = '#014DB2'
    advice = '建议穿棉服、羽绒服，戴围巾手套'
  }
  if (diff >= 10 && level !== '寒冷' && level !== '较冷') {
    advice = `昼夜温差 ${Math.round(diff)}℃，建议穿方便增减的衣物`
  }
  return { level, color, advice }
}

/**
 * 洗车指数：未来 24h 降水与降水概率
 * @param {number} precipSum 24h 降水量 mm
 * @param {number} precipProb 24h 最大降水概率 %
 * @returns {{level:string, color:string, advice:string}}
 */
function calcCarWash(precipSum, precipProb) {
  const rain = precipSum > 0.5 || precipProb >= 60
  const drizzle = precipSum > 0.1 || precipProb >= 30
  if (rain) {
    return { level: '不宜', color: '#EF4444', advice: '未来 24 小时有降水，不建议洗车' }
  }
  if (drizzle) {
    return { level: '一般', color: '#F59E0B', advice: '可能有零星降水，建议避开雨时段' }
  }
  return { level: '适宜', color: '#10B981', advice: '未来 24 小时无降水，适合洗车' }
}

/**
 * 运动指数：体感温度 + 风 + 降水概率
 * @param {number} feels 体感温度 ℃
 * @param {number} windMax 最大风速 km/h
 * @param {number} precipProb 降水概率 %
 * @returns {{level:string, color:string, advice:string}}
 */
function calcSport(feels, windMax, precipProb) {
  const bad = precipProb >= 60
  const wind = windMax >= 38
  if (bad) {
    return { level: '不宜', color: '#EF4444', advice: '降水概率较高，建议改室内运动' }
  }
  if (feels >= 30) {
    return { level: '较不宜', color: '#F59E0B', advice: '体感偏热，建议清晨或傍晚户外运动' }
  }
  if (wind) {
    return { level: '一般', color: '#F59E0B', advice: '风力较大，户外运动注意安全' }
  }
  if (feels >= 18 && feels <= 26) {
    return { level: '较宜', color: '#10B981', advice: '气温适宜，午后户外运动较舒适' }
  }
  if (feels >= 10 && feels < 18) {
    return { level: '适宜', color: '#10B981', advice: '凉爽舒适，适合户外运动' }
  }
  return { level: '较不宜', color: '#F59E0B', advice: '气温偏低，建议室内运动或做好保暖' }
}

/**
 * 感冒指数：昼夜温差 + 风力 + 湿度
 * @param {number} diff 昼夜温差 ℃
 * @param {number} windMax 最大风速 km/h
 * @param {number} humidity 湿度 %
 * @returns {{level:string, color:string, advice:string}}
 */
function calcColdRisk(diff, windMax, humidity) {
  let score = 0
  if (diff >= 12) score += 2
  else if (diff >= 8) score += 1
  if (windMax >= 30) score += 1
  if (humidity >= 85) score += 1
  // 温差 ≥12℃ 本身即属剧烈波动，直接判易发
  if (diff >= 12) {
    return { level: '易发', color: '#EF4444', advice: '昼夜温差大，注意及时增减衣物' }
  }
  if (score >= 3) {
    return { level: '易发', color: '#EF4444', advice: '昼夜温差大且风力较强，注意及时增减衣物' }
  }
  if (score === 2) {
    return { level: '较易发', color: '#F59E0B', advice: '昼夜温差较大，请根据体感调整衣物' }
  }
  if (score === 1) {
    return { level: '易发', color: '#F59E0B', advice: '温度变化较明显，敏感人群注意防护' }
  }
  return { level: '少发', color: '#10B981', advice: '昼夜温差 8℃以内，注意及时增减衣物' }
}

/**
 * 晾晒指数：降水量 + 紫外线 + 风速
 * @param {number} precipSum 降水量 mm
 * @param {number} uvMax 最大紫外线
 * @param {number} windMax 最大风速 km/h
 * @returns {{level:string, color:string, advice:string}}
 */
function calcDrying(precipSum, uvMax, windMax) {
  if (precipSum > 1) {
    return { level: '不宜', color: '#EF4444', advice: '有降水，不宜户外晾晒' }
  }
  if (precipSum > 0.1) {
    return { level: '一般', color: '#F59E0B', advice: '可能有零星降水，晾晒效果一般' }
  }
  if (windMax >= 30) {
    return { level: '一般', color: '#F59E0B', advice: '风力较大，衣物不易晾干' }
  }
  if (uvMax >= 6) {
    return { level: '适宜', color: '#10B981', advice: '日照充足，风力适中，适宜晾晒' }
  }
  return { level: '一般', color: '#F59E0B', advice: '云量较多，晾晒效果一般' }
}

/**
 * 过敏指数：干燥度代理（低湿度 + 大温差 → 花粉扩散）
 * @param {number} humidity 湿度 %
 * @param {number} diff 昼夜温差 ℃
 * @param {number} windMax 最大风速 km/h
 * @returns {{level:string, color:string, advice:string}}
 */
function calcAllergy(humidity, diff, windMax) {
  let score = 0
  if (humidity <= 45) score += 2
  else if (humidity <= 60) score += 1
  if (diff >= 10) score += 1
  if (windMax >= 25) score += 1
  if (score >= 3) {
    return { level: '高', color: '#EF4444', advice: '气候干燥多风，花粉扩散明显，过敏人群请做好防护' }
  }
  if (score === 2) {
    return { level: '中', color: '#F59E0B', advice: '花粉浓度中等，过敏人群外出建议佩戴口罩' }
  }
  return { level: '低', color: '#10B981', advice: '花粉浓度低，过敏风险较小' }
}

/**
 * 出行指数：降水 + 风 + 温差
 * @param {number} precipProb 降水概率 %
 * @param {number} windMax 最大风速 km/h
 * @param {number} diff 昼夜温差 ℃
 * @returns {{level:string, color:string, advice:string}}
 */
function calcTravel(precipProb, windMax, diff) {
  if (precipProb >= 70) {
    return { level: '较差', color: '#EF4444', advice: '降水概率高，出行请携带雨具' }
  }
  if (windMax >= 38) {
    return { level: '较差', color: '#EF4444', advice: '风力较大，出行注意安全' }
  }
  if (precipProb >= 30) {
    return { level: '一般', color: '#F59E0B', advice: '可能有降水，建议随身携带折叠伞' }
  }
  if (diff >= 12) {
    return { level: '一般', color: '#F59E0B', advice: '昼夜温差大，请注意调整外套厚度' }
  }
  return { level: '良好', color: '#10B981', advice: '路况通畅，适合驾车出行' }
}

/**
 * 计算全部 8 项生活指数
 * @param {Object} p 入参
 * @param {number} p.feels 体感温度 ℃
 * @param {number} p.high 最高温 ℃
 * @param {number} p.low 最低温 ℃
 * @param {number} p.humidity 湿度 %
 * @param {number} p.precipSum 24h 降水量 mm
 * @param {number} p.precipProb 24h 最大降水概率 %
 * @param {number} p.uvMax 最大紫外线指数
 * @param {number} p.windMax 最大风速 km/h
 * @returns {Array<{key:string,name:string,level:string,color:string,advice:string}>}
 */
export function calcIndices(p = {}) {
  const {
    feels = 20,
    high = 25,
    low = 15,
    humidity = 60,
    precipSum = 0,
    precipProb = 0,
    uvMax = 0,
    windMax = 0
  } = p
  const diff = Math.abs((high || 0) - (low || 0))
  const uv = uvLevel(uvMax)

  return [
    { key: 'dressing', name: '穿衣', ...calcDressing(feels, diff) },
    { key: 'uv', name: '紫外线', level: uv.level, color: uv.color, advice: uv.advice },
    { key: 'carWash', name: '洗车', ...calcCarWash(precipSum, precipProb) },
    { key: 'sport', name: '运动', ...calcSport(feels, windMax, precipProb) },
    { key: 'cold', name: '感冒', ...calcColdRisk(diff, windMax, humidity) },
    { key: 'drying', name: '晾晒', ...calcDrying(precipSum, uvMax, windMax) },
    { key: 'allergy', name: '过敏', ...calcAllergy(humidity, diff, windMax) },
    { key: 'travel', name: '出行', ...calcTravel(precipProb, windMax, diff) }
  ]
}
