/**
 * @file 收货地址域 mock 处理器
 *
 * 业务规则（PRD §⑦）：
 * - 支持新增/编辑/删除/设默认，微信地址一键导入由前端 chooseAddress 实现，服务端只收结果
 * - phone 真实环境密文存储（PRD §7.5 / 技术审核 T5），mock 阶段明文存放、展示层脱敏
 * - 下单使用地址时写入订单 addressSnapshot 固化（见 order.create）
 */

import { db, nextId } from '../db'

/** 地址字段校验：新增/编辑共用 */
function validate(addr) {
  if (!addr.receiver || !String(addr.receiver).trim()) throw { code: 40010, msg: '请填写收货人' }
  if (!/^1\d{10}$/.test(String(addr.phone || ''))) throw { code: 40010, msg: '手机号格式不正确' }
  if (!addr.region || !addr.detail) throw { code: 40010, msg: '请填写完整地址' }
}

export default {
  /**
   * 地址列表（phone 交由前端 maskedPhone 脱敏展示）
   * @returns {Array<Object>}
   */
  'address.list'() {
    return db.addresses
  },

  /**
   * 新增/编辑地址（有 id 为编辑，无 id 为新增）
   * @param {{id?:string, receiver:string, phone:string, region:string, detail:string, isDefault?:boolean}} params
   * @returns {{id: string}} 地址 ID（新增时返回新 ID）
   * @throws 40010 字段校验失败
   */
  'address.save'(params) {
    validate(params)

    if (params.id) {
      const idx = db.addresses.findIndex((a) => a.id === params.id)
      if (idx === -1) throw { code: 40404, msg: '地址不存在' }
      db.addresses[idx] = { ...db.addresses[idx], ...params }
      return { id: db.addresses[idx].id }
    }

    // 设为默认时先清掉其他默认项，保证全局唯一默认地址
    if (params.isDefault) db.addresses.forEach((a) => { a.isDefault = false })
    const id = nextId('a')
    db.addresses.push({ ...params, id })
    return { id }
  },

  /**
   * 删除地址（已被历史订单引用不影响——订单持有的是 addressSnapshot 快照）
   * @param {{id:string}} params
   * @throws 40404 地址不存在
   */
  'address.remove'(params) {
    const before = db.addresses.length
    db.addresses = db.addresses.filter((a) => a.id !== params.id)
    if (db.addresses.length === before) throw { code: 40404, msg: '地址不存在' }
    return {}
  },

  /**
   * 设为默认地址
   * @param {{id:string}} params
   */
  'address.setDefault'(params) {
    const target = db.addresses.find((a) => a.id === params.id)
    if (!target) throw { code: 40404, msg: '地址不存在' }
    db.addresses.forEach((a) => { a.isDefault = a.id === params.id })
    return {}
  }
}
