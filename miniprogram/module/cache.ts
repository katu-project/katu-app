import Base from "@/class/base"
import { LocalCacheKeyMap } from "@/const"

class Cache extends Base {
  cloudFileTempUrls: IAnyObject = {}
  inited: boolean = false
  config = {} as ICacheModuleInitConfig
  constructor(){
    super()
  }

  async init(config:ICacheModuleInitConfig){
    this.config = config
    await this.loadData()
    this.inited = true
  }

  async loadData(){
    // let cacheUrls = await this.getLocalData('CloudFileTempUrlCacheKey')
    // if(!cacheUrls){
    //   cacheUrls = {}
    // }
    this.cloudFileTempUrls = {}
  }

  async getHomeData(){
    const homeDataCache = await this.getLocalData<IHomeDataCache>(LocalCacheKeyMap.HOME_DATA_CACHE_KEY)
    if(homeDataCache){
      const nowTime = new Date().getTime()
      if(homeDataCache.cacheTime + this.config.homeDataCacheTime > nowTime){
        console.debug('使用首页缓存数据')
        return homeDataCache.data
      }
    }
    return
  }

  async setHomeCacheData(homeData:IHomeData){
    const cacheData = {
      cacheTime: new Date().getTime(),
      data: homeData
    }
    return this.setLocalData(LocalCacheKeyMap.HOME_DATA_CACHE_KEY, cacheData)
  }

  async deleteHomeData(){
    this.deleteLocalData(LocalCacheKeyMap.HOME_DATA_CACHE_KEY)
  }
}


function getCacheModule(){
  return Cache.getInstance<Cache>()
}

export {
  getCacheModule
}