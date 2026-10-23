/**
 * @file mock 引擎：按通道分发到对应 handler，模拟网络延迟与统一响应结构
 *
 * 核心约定（与真实接口严格同构，切换接口时页面零改动）：
 * 1. 响应结构统一为 { code: 0, data, msg }——与 api/http.js 的真实响应解包一致
 * 2. handler 内通过 throw { code, msg } 表达业务失败（库存不足/已下架等），
 *    与真实接口的"非 0 code"错误对齐
 * 3. 模拟 200-500ms 随机延迟，还原真实网络体感（loading 态才不是假的）
 *
 * 新增接口步骤：
 *   ① mock/handlers/<domain>.js 加 handler（channel = 'domain.action'）
 *   ② api/index.js 加对应方法（url 与后端约定）
 *   ③ 页面只 import api，永远不直接碰 mock
 */

import { MALL_CONFIG } from '../config'
import goods from './handlers/goods'
import cart from './handlers/cart'
import order from './handlers/order'
import address from './handlers/address'
import size from './handlers/size'
import drop from './handlers/drop'

/** 通道注册表：key = 'domain.action'，value = handler(params) => data */
const handlers = {
  ...goods,
  ...cart,
  ...order,
  ...address,
  ...size,
  ...drop
}

/**
 * mock 调用入口
 * @param {string} channel 通道名，如 'goods.list'
 * @param {Object} [params] 业务参数
 * @returns {Promise<{code:number, data:Object, msg:string}>} 统一响应结构
 *   - 成功：{ code: 0, data: handler返回值, msg: 'ok' }
 *   - 失败：reject { code: handler抛出的code或500, msg }
 */
export function mock(channel, params) {
  const [min, max] = MALL_CONFIG.MOCK_DELAY
  const delay = min + Math.floor(Math.random() * (max - min))

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const handler = handlers[channel]
      if (!handler) {
        reject({ code: 50001, msg: `[mock] 未实现的通道: ${channel}` })
        return
      }
      try {
        resolve({ code: 0, data: handler(params || {}), msg: 'ok' })
      } catch (e) {
        // handler 通过 throw { code, msg } 表达业务错误（库存不足等）
        reject({ code: e.code || 500, msg: e.msg || '服务异常' })
      }
    }, delay)
  })
}
