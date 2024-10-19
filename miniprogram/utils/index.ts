import debounce from 'lodash.debounce'
import clonedeep from 'lodash.clonedeep'
import before from 'lodash.before'
import after from 'lodash.after'

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

const lodash = {
  debounce,
  before,
  after,
  clonedeep
}

export {
  lodash
}