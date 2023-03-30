import Base from "@/class/base"
import { LocalCacheKeyMap } from "@/const"
import { file } from "@/utils/index"

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

  // master key cache
  async getMasterKey(){
    return this.getLocalData<string>(LocalCacheKeyMap.MASTER_KEY_CACHE_KEY)
  }

  async setMasterKey(masterKey:string){
    return this.setLocalData(LocalCacheKeyMap.MASTER_KEY_CACHE_KEY, masterKey)
  }

  async deleteMasterKey(){
    this.deleteLocalData(LocalCacheKeyMap.MASTER_KEY_CACHE_KEY)
  }

  // home data cache
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

  // card data cache
  async getCards(){
    const cacheData = await this.getLocalData<{[id:string]:ICard}>(LocalCacheKeyMap.CARD_DATA_CACHE_KEY)
    return cacheData || {}
  }

  async getCard(id:string){
    const cards = await this.getCards()
    if(cards[id]) return cards[id]
    return undefined
  }

  async setCard(card:ICard){
    const cards = await this.getCards()
    cards[card._id] = card
    return this.setLocalData(LocalCacheKeyMap.CARD_DATA_CACHE_KEY,cards)
  }

  async deleteCard(id:string){
    const cards = await this.getCards()
    delete cards[id]
    return this.setLocalData(LocalCacheKeyMap.CARD_DATA_CACHE_KEY,cards)
  }

  // card image cache
  async getCardImage(image:ICardImage, options){
    const cacheData = {
      imagePath: '',
      extraData: []
    }
    cacheData.imagePath = await this.getImageFilePath(image)
    await file.checkAccess(cacheData.imagePath)
    if(!options?.imagePath){
      cacheData.extraData = await this.getCardExtraData(image)
      console.debug('命中完整缓存图片数据')
    }
    return cacheData
  }

  async getExtraData(){
    const cacheData = await this.getLocalData(LocalCacheKeyMap.CARD_EXTRA_DATA_CACHE_KEY)
    return cacheData || {}
  }
  
  async getCardExtraData(image:ICardImage){
    const keyName = this.getExtraDataKey(image)
    const cacheData = await this.getExtraData()
    return cacheData[keyName] || []
  }

  async setCardExtraData(image:ICardImage, data:any[]){
    const keyName = this.getExtraDataKey(image)
    const cacheData = await this.getExtraData()
    cacheData[keyName] = data
    return this.setLocalData(LocalCacheKeyMap.CARD_EXTRA_DATA_CACHE_KEY, cacheData)
  }

  async deleteCardExtraData(image:ICardImage){
    const keyName = this.getExtraDataKey(image)
    const cacheData = await this.getExtraData()
    console.debug('删除缓存卡片附加数据', keyName, cacheData[keyName])
    delete cacheData[keyName]
    return this.setLocalData(LocalCacheKeyMap.CARD_EXTRA_DATA_CACHE_KEY, cacheData)
  }
  
  getExtraDataKey(image:ICardImage){
    return `${image.hash}_${image.salt}`
  }

  // clear all cache
  async clearAll(){
    for (const key in LocalCacheKeyMap) {
      await this.deleteLocalData(key)
    }
  }
}


function getCacheModule(){
  return Cache.getInstance<Cache>()
}

export {
  getCacheModule
}