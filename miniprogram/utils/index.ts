import debounce from 'lodash.debounce'
import clonedeep from 'lodash.clonedeep'
import before from 'lodash.before'
import after from 'lodash.after'
import { getCurrentTimestamp } from './base'

export { selfish, objectSetValue, mergeDeep, sleep, getCurrentTimestamp } from './base'
export * as crypto from './crypto'
export * as file from './file'
export * as net from './net'
export * as convert from './convert'
export * from './action'
export * as cache from './cache'
export { UPNG as upng } from './upng'
export * as bip39 from './bip39/index'
export * as qrcode from './qrcode/index'
export * as cos from './cos'

/**
 * 超时检测，返回时间秒数 s，大于 0 差 s 秒超时，小于 0 超时 s 秒
 * @param oldTime 开始时间
 * @param gapTime 超时时间
 * @returns s number
 */
function checkTimeout(oldTime:number, gapTime:number){
  const nowTime = getCurrentTimestamp()
  // 兼容秒处理
  oldTime = String(oldTime).length === 10 ? oldTime * 1000 : oldTime
  if(oldTime > nowTime) return 0
  const costTime = Math.floor((nowTime - oldTime)/1000)
  return gapTime - costTime
}

const lodash = {
  debounce,
  before,
  after,
  clonedeep
}

export {
  lodash,
  checkTimeout
}