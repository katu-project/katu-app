import debounce from 'lodash.debounce'
import clonedeep from 'lodash.clonedeep'

export { selfish, objectSetValue, createAdvSetData, mergeDeep, sleep } from './base'
export * as crypto from './crypto'
export * as file from './file'
export * as net from './net'
export * as convert from './convert'
export * from './action'
export * as cache from './cache'
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

export {
  debounce,
  clonedeep,
  checkTimeout
}