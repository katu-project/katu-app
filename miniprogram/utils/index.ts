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

function checkTimeout(oldTime:number, gapTime:number){
  const nowTime = getCurrentTimestamp()
  if(oldTime > nowTime) return 0
  const costTime = Math.floor((nowTime - oldTime)/1000)
  const remainSecond =  costTime - gapTime
  if(remainSecond >= 0) throw Error('Timeout')
  return -remainSecond
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