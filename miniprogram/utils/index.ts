import * as crypto from './crypto'
import * as file from './file'
import * as convert from './convert'
import { cv } from './opencv/index'
import { UPNG as upng } from './upng'
import * as bip39 from './bip39/index'
import { drawQrcode as qrcode } from './qrcode/index'

export function selfish (target) {
  const cache = new WeakMap();
  const handler = {
    get (target, key) {
      const value = Reflect.get(target, key);
      if (typeof value !== 'function') {
        return value;
      }
      if (!cache.has(value)) {
        cache.set(value, value.bind(target));
      }
      return cache.get(value);
    }
  };
  const proxy = new Proxy(target, handler);
  return proxy;
}

export function objectSetValue(obj,path,value) {
  let i
  path = path.split('_')
  for (i = 0; i < path.length - 1; i++){
    if(!(path[i] in obj)) throw Error('path not exist')
    obj = obj[path[i]];
  }
  obj[path[i]] = value;
}

export * as crypto from './crypto'
export * as file from './file'
export * as convert from './convert'
export * from './action'
export { cv } from './opencv/index'
export { UPNG as upng } from './upng'
export * as bip39 from './bip39/index'
export { drawQrcode as qrcode } from './qrcode/index'

export default {
  selfish,
  objectSetValue,
  crypto,
  file,
  convert,
  cv,
  upng,
  bip39,
  qrcode
}