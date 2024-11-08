export async function getCache<T>(key:string){
  const { data } = await wx.getStorage({ key })
  return data as T
}

export async function setCache(key, data){
  return wx.setStorage({
    key,
    data
  })
}

export async function delCache(key){
  return wx.removeStorage({
    key
  })
}

export function getCacheSync(key){
  try {
    return wx.getStorageSync(key)
  } catch (error) {
    return
  }
}

export default {
  getCache,
  setCache,
  delCache
}