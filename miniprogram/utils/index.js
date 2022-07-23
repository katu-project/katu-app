const crypto = require('./crypto')
const file = require('./file')
const convert = require('./convert')
const action = require('./action')
const cv = require('./opencv/index')
const upng = require('./upng')
const bip39 = require('./bip39/index')

function selfish (target) {
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

function objectSetValue(obj,path,value) {
  let i
  path = path.split('_')
  for (i = 0; i < path.length - 1; i++){
    if(!(path[i] in obj)) throw Error('path not exist')
    obj = obj[path[i]];
  }
  obj[path[i]] = value;
}

module.exports = {
  selfish,
  objectSetValue,
  crypto,
  file,
  convert,
  cv,
  upng,
  bip39,
  ...action
}