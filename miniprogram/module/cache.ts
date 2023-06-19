import Module from "@/class/module"
import { file } from "@/utils/index"
 
class Cache extends Module {
  config = {} as ICacheModuleInitConfig
  
  constructor(){
    super()
  }

  init(config:ICacheModuleInitConfig){
    this.config = config
    console.debug('Module Cache inited')
  }

  // user cache
  async getUserAvatar(url:string){
    try {
      const cachePath = await this.getUserAvatarCachePath(url)
      await file.checkAccess(cachePath)
      console.log('使用缓存头像数据')
      return cachePath
    } catch (_) {
      console.error('无有效缓存头像数据')
    }
    return ''
  }

  async setUserAvatar(url:string){
    console.debug('开始缓存用户头像')
    try {
      await file.rmdir(this.config.userAvatarDir, true)
    } catch (_) {}

    try {
      const cachePath = await this.getUserAvatarCachePath(url)
      await this.downloadFile({url, savePath: cachePath})
    } catch (error) {
      console.error('缓存头像下载错误:',error)
    }
  }

  async getUserAvatarCachePath(url){
    const splitUrl = url.split('/')
    const avatarId = splitUrl[splitUrl.length - 1]
    return this.getFilePath(this.config.userAvatarDir, avatarId)
  }

  // master key cache
  async getMasterKey(){
    return this.getLocalData<string>(this.LocalCacheKeyMap.MASTER_KEY_CACHE_KEY)
  }

  async setMasterKey(masterKey:string){
    return this.setLocalData(this.LocalCacheKeyMap.MASTER_KEY_CACHE_KEY, masterKey)
  }

  async deleteMasterKey(){
    this.deleteLocalData(this.LocalCacheKeyMap.MASTER_KEY_CACHE_KEY)
  }

  // home data cache
  async getHomeData(){
    const homeDataCache = await this.getLocalData<IHomeDataCache>(this.LocalCacheKeyMap.HOME_DATA_CACHE_KEY)
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
    console.debug('设置首页数据缓存')
    const cacheData = {
      cacheTime: new Date().getTime(),
      data: homeData
    }
    return this.setLocalData(this.LocalCacheKeyMap.HOME_DATA_CACHE_KEY, cacheData)
  }

  async deleteHomeData(){
    this.deleteLocalData(this.LocalCacheKeyMap.HOME_DATA_CACHE_KEY)
  }

  // card data cache
  async getCards(){
    const cacheData = await this.getLocalData<{[id:string]:ICard}>(this.LocalCacheKeyMap.CARD_DATA_CACHE_KEY)
    return cacheData || {}
  }

  async getCard(id:string){
    const cards = await this.getCards()
    if(cards[id]) {
      console.debug('getCard 命中缓存')
      return cards[id]
    }
    return undefined
  }

  async setCard(card:ICard){
    console.debug('setCard cache:', card._id)
    const cards = await this.getCards()
    cards[card._id] = card
    // 加密卡片在解密时设置附加数据缓存，普通卡片在这里缓存附加数据
    if(!card.encrypted){
      await this.setCardExtraData(card._id, card.info)
    }
    return this.setLocalData(this.LocalCacheKeyMap.CARD_DATA_CACHE_KEY,cards)
  }

  async deleteCard(id:string){
    const cards = await this.getCards()
    delete cards[id]
    return this.setLocalData(this.LocalCacheKeyMap.CARD_DATA_CACHE_KEY,cards)
  }

  // card image cache
  async setCardImage(image:ICardImage, isEncrypt:boolean){
    console.debug('setCardImage cache:', image.hash)
    const cachePath = await this.getImageFilePath(image)
    if(isEncrypt){
      try {
        await file.moveFile(image._url, cachePath)
      } catch (error) {
        console.error('缓存加密图片失败:',error)
      }
    }else{
      try {
        await this.downloadFile({
          url: image.url,
          savePath: cachePath
        })
      } catch (error) {
        console.error('缓存普通图片失败:',error)
      }
    }
  }

  async deleteCardImage(card: ICard){
    await this.deleteCardExtraData(card._id)
    for (const image of card.image) {
      try {
        const path = await this.getImageFilePath(image)
        await file.deleteFile(path)
        console.debug('delete temp file:', path)
      } catch (_) {}
  
      try {
        const path = await this.getDownloadFilePath(image)
        await file.deleteFile(path)
        console.debug('delete temp file:', path)
      } catch (_) {}
  
      // try delete temp file : 
      try {
        const path = await this.getTempFilePath(image.hash)
        await file.deleteFile(path)
        console.debug('delete temp file:', path)
      } catch (_) {}
    }
  }

  async getCardImagePath(image:ICardImage){
    const imagePath = await this.getImageFilePath(image)
    try {
      await file.checkAccess(imagePath)
    } catch (error:any) {
      if(!error.message.includes('access:fail')){
        console.error('getCardImage error:', error)
      }
      throw error
    }
    return imagePath
  }

  async getExtraData(){
    const cacheData = await this.getLocalData(this.LocalCacheKeyMap.CARD_EXTRA_DATA_CACHE_KEY)
    return cacheData || {}
  }
  
  async getCardExtraData(cardId:string){
    const cacheData = await this.getExtraData()
    return cacheData[cardId] || []
  }

  async setCardExtraData(cardId:string, data:any[]){
    console.debug('setCardExtraData cache:', cardId)
    const cacheData = await this.getExtraData()
    cacheData[cardId] = data
    return this.setLocalData(this.LocalCacheKeyMap.CARD_EXTRA_DATA_CACHE_KEY, cacheData)
  }

  async deleteCardExtraData(cardId:string|string[]){
    const cacheData = await this.getExtraData()
    if(typeof cardId === 'string'){
      console.debug('删除缓存卡片附加数据', cardId, cacheData[cardId])
      delete cacheData[cardId]
    }else{
      cardId.forEach(id => delete cacheData[id])
    }
    return this.setLocalData(this.LocalCacheKeyMap.CARD_EXTRA_DATA_CACHE_KEY, cacheData)
  }

  // clear all cache
  async clearAll(){
    for (const key in this.LocalCacheKeyMap) {
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