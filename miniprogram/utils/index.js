const crypto = require('./crypto')
const file = require('./file')
const convert = require('./convert')
const action = require('./action')

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

module.exports = {
  selfish,
  crypto,
  file,
  convert,
  ...action
}