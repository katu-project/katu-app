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
  async getUser(){
    return this.getLocalData<{data:IUser,time:number}>('USER_INFO_CACHE_KEY')
  }

  async setUser(user){
    const cacheData = {
      data: user,
      time: this.currentTimestamp
    }
    return this.setLocalData('USER_INFO_CACHE_KEY', cacheData)
  }

  async deleteUser(){
    this.deleteLocalData('USER_INFO_CACHE_KEY')
  }

  async setUserAvatar(url:string){
    const cachePath = await this.getUserAvatarCachePath(url)
    const cacheFile = await file.checkAccess(cachePath).catch(_=>{
      console.warn('no valid avatar cache')
    })
   
    if(cacheFile){
      console.log('use cache avatar')
    }else{
      console.debug('start cache avatar')
      try {
        await file.rmdir(this.config.userAvatarDir)
      } catch (_) {}

      try {
        const cachePath = await this.getUserAvatarCachePath(url)
        await this.downloadFile({url, savePath: cachePath})
      } catch (error) {
        console.error('cache avatar download failed:',error)
      }
    }
    return cachePath
  }

  async getUserAvatarCachePath(url){
    const splitUrl = url.split('/')
    const avatarId = splitUrl[splitUrl.length - 1]
    return this.getFilePath(this.config.userAvatarDir, avatarId)
  }

  // user custom tags
  async getTags(){
    return this.getLocalData<ICardTag[]>('USER_TAGS_CACHE_KEY')
  }

  async setTags(tags){
    return this.setLocalData('USER_TAGS_CACHE_KEY', tags)
  }

  async deleteTags(){
    this.deleteLocalData('USER_TAGS_CACHE_KEY')
  }
  // user custom tags end

  async getLoginToken(){
    return this.getLocalData<string>('KATU_APP_TOKEN')
  }

  async setLoginToken(value:string){
    return this.setLocalData('KATU_APP_TOKEN', value)
  }

  async deleteLoginToken(){
    this.deleteLocalData('KATU_APP_TOKEN')
  }

  // master key cache
  async getMasterKey(){
    return this.getLocalData<string>('MASTER_KEY_CACHE_KEY')
  }

  async setMasterKey(masterKey:string){
    return this.setLocalData('MASTER_KEY_CACHE_KEY', masterKey)
  }

  async deleteMasterKey(){
    this.deleteLocalData('MASTER_KEY_CACHE_KEY')
  }

  async deleteMiniKey(){
    await file.rmdir(this.getConst('APP_MINI_KEY_DIR')).catch(console.error)
  }

  // home data cache
  async getHomeData(){
    const data = await this.getLocalData<IHomeDataCache>('HOME_DATA_CACHE_KEY')
    return data
  }

  async setHomeCacheData(homeData:IHomeData){
    console.debug('set home data cache')
    const cacheData = {
      cacheTime: this.currentTimestamp,
      data: homeData
    }
    return this.setLocalData('HOME_DATA_CACHE_KEY', cacheData)
  }

  async deleteHomeData(){
    this.deleteLocalData('HOME_DATA_CACHE_KEY')
  }

  // card data cache
  async getCards(){
    const cacheData = await this.getLocalData<{[id:string]:ICard}>('CARD_DATA_CACHE_KEY')
    return cacheData || {}
  }

  async getCard(id:string){
    const cards = await this.getCards()
    if(cards[id]) {
      console.debug('getCard hit cache')
      return cards[id]
    }
    return undefined
  }

  async setCardField(id, path, value){
    const card = await this.getCard(id)
    if(!card) return
    this.objectSetValue(card, path, value)
    return this.setCard(card)
  }

  async setCard(card:ICard){
    console.debug('setCard cache:', card._id)
    const cards = await this.getCards()
    cards[card._id] = card
    return this.setLocalData('CARD_DATA_CACHE_KEY',cards)
  }

  async deleteCard(id:string){
    const cards = await this.getCards()
    delete cards[id]
    return this.setLocalData('CARD_DATA_CACHE_KEY',cards)
  }

  async deleteAllCard(){
    await this.deleteLocalData('CARD_DATA_CACHE_KEY')
    await this.deleteLocalData('CARD_EXTRA_DATA_CACHE_KEY')
  }

  // card image cache
  async setCardImage(image:ICardImage, isEncrypt:boolean){
    console.debug('setCardImage cache:', image.hash)
    const cachePath = await this.getImageFilePath(image)
    if(isEncrypt){
      try {
        await file.moveFile(image._url, cachePath)
      } catch (error) {
        console.error('cache crypto card failed :',error)
      }
    }else{
      try {
        await this.downloadFile({
          url: image.url,
          savePath: cachePath
        })
      } catch (error) {
        console.error('cache un-crypto card failed :',error)
      }
    }
  }

  async deleteCardImage(card: Pick<ICard,'_id'|'image'>){
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

  async getExtraDatas(){
    const cacheData = await this.getLocalData<{[key:string]:string[][]}>('CARD_EXTRA_DATA_CACHE_KEY')
    return cacheData || {}
  }
  
  async getCardExtraData(cardId:string){
    const cacheData = await this.getExtraDatas()
    return cacheData[cardId] || []
  }

  async setCardExtraData(cardId:string, data:any[]){
    console.debug('setCardExtraData cache:', cardId)
    const cacheData = await this.getExtraDatas()
    cacheData[cardId] = data
    return this.setLocalData('CARD_EXTRA_DATA_CACHE_KEY', cacheData)
  }

  async deleteCardExtraData(cardId:string|string[]){
    const cacheData = await this.getExtraDatas()
    if(typeof cardId === 'string'){
      console.debug('delte card extra data cache ', cardId, cacheData[cardId])
      delete cacheData[cardId]
    }else{
      cardId.forEach(id => delete cacheData[id])
    }
    return this.setLocalData('CARD_EXTRA_DATA_CACHE_KEY', cacheData)
  }

  async deleteCardFile(imageIds:string[]){
    try {
      const localImageIdxs = await file.readdir(this.getConst('APP_IMAGE_DIR'))
      const invalidIds = localImageIdxs.filter(e=>!imageIds.includes(e))
      invalidIds.forEach( async fileId=>{
        const path = await this.getFilePath(this.getConst('APP_IMAGE_DIR'), fileId)
        file.deleteFile(path)
      })
      console.log(`delete invalid card image: ${invalidIds.length} rows`)
    } catch (_) {}
    try {
      const localDownIdxs = await file.readdir(this.getConst('APP_DOWN_DIR'))
      const invalidIds = localDownIdxs.filter(e=>!imageIds.includes(e))
      invalidIds.forEach( async fileId=>{
        const path = await this.getFilePath(this.getConst('APP_DOWN_DIR'), fileId)
        file.deleteFile(path)
      })
      console.log(`delete invalid download file: ${invalidIds.length} rows`)
    } catch (_) {}
    this.setLocalData('CACHE_CLEAR_TIME', this.currentTimestamp)
  }

  async clearTempDirFile(){
    try {
      await file.checkAccess(this.getConst('APP_TEMP_DIR'))
      await file.rmdir(this.getConst('APP_TEMP_DIR'))
    } catch (error:any) {
      if(!error.message.startsWith('access:fail no such file or directory')){
        console.error('clearTempDirFile:',error)
      }
    }
  }

  async clearAll(){
    await this.deleteAllLocalData()
  }
}


function getCacheModule(){
  return Cache.getInstance<Cache>()
}

export {
  getCacheModule
}