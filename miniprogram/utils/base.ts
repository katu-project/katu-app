export async function sleep(t=1000){
  return new Promise((resolve)=>{
    setTimeout(resolve,t)
  })
}

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

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

export function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

export function createAdvSetData(originSetData,dataCount:number,gap?:number){
  let dataSets: any[] = []
  let doIdx = 0
  gap = gap || 4
  return function(setData){
    dataSets.push(setData)
    doIdx ++
    if(dataSets.length % gap! !== 0 && doIdx !== dataCount){
      return
    }
    const _setData = dataSets.reduce((a,b)=>Object.assign(a,b))
    const _setDataLength = Object.keys(_setData).length
    if(_setDataLength){
      originSetData(_setData)
    }
    if(doIdx === dataCount){
      console.debug('adv setData  end:',`${dataSets.length}/${dataCount}`)
    }else if(dataSets.length % gap! === 0){
      console.debug('adv setData part:',`${dataSets.length}/${dataCount}`)
      dataSets = []
    } 
  }
}

export default {
  sleep,
  mergeDeep,
  selfish,
  objectSetValue,
  createAdvSetData
}