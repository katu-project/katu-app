import { selfish, objectSetValue, createAdvSetData } from './base'
import debounce from 'lodash.debounce'
import clonedeep from 'lodash.clonedeep'
import * as crypto from './crypto'
import * as file from './file'
import * as convert from './convert'
import { UPNG as upng } from './upng'
import * as bip39 from './bip39/index'
import { drawQrcode as qrcode } from './qrcode/index'
import cache from './cache'

export { selfish, objectSetValue, createAdvSetData, mergeDeep, sleep } from './base'
export * as crypto from './crypto'
export * as file from './file'
export * as net from './net'
export * as convert from './convert'
export * from './action'
export { UPNG as upng } from './upng'
export * as bip39 from './bip39/index'
export { drawQrcode as qrcode } from './qrcode/index'

function checkTimeout(oldTime:number, gapTime:number){
  const now = new Date().getTime()
  if(oldTime > now) return 0
  const costTime = Math.floor((now - oldTime)/1000)
  const remainSecond =  costTime - gapTime
  if(remainSecond >= 0) throw Error('Timeout')
  return -remainSecond
}

export default {
  selfish,
  objectSetValue,
  createAdvSetData,
  debounce,
  crypto,
  file,
  convert,
  upng,
  bip39,
  qrcode
}

export {
  debounce,
  clonedeep,
  cache,
  checkTimeout
}