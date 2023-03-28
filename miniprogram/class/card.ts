import Base from '@/class/base'
import { getCache, setCache, sleep, file} from '@/utils/index'
import { LocalCacheKeyMap, WX_CLOUD_STORAGE_FILE_HEAD } from '@/const'
import api from '@/api'
import { getAppManager } from '@/class/app'
import { getUserManager } from '@/class/user'
import { getCryptoModule } from '@/module/crypto'
import { getCacheModule } from '@/module/cache'

class CardManager extends Base{
  constructor(){
    super()
    this.init()
  }

  init(){
  }

  get app(){
    return getAppManager()
  }

  get user(){
    return getUserManager()
  }

  get cache(){
    return getCacheModule()
  }

  get crypto(){
    return getCryptoModule()
  }
  /* 
    1. 没变动，url 以 cloud 开头
    2. 变动，使用本地图片，url 以 http/wxfile 开头
    3. 变动，使用外部接口，url 以 cloud 开头
  */
  async _updateNotEncryptImage(card:Partial<ICard>){
    const images:ICardImage[] = []
    for (const pic of card.image!) {
      const imageData = {url:'',salt:'',hash:''}
      const originPicUrl = pic.url
      // 统一转换成本地资源
      if(pic.url.startsWith(WX_CLOUD_STORAGE_FILE_HEAD)){
        pic.url = await this.downloadImage(pic)
      }

      imageData.hash = await this.getHash(pic.url)
      
      if(pic.hash === imageData.hash){
        imageData.url = originPicUrl
      }else{
        await this.checkImageType(pic.url)
        console.log('检测到图片修改，重新上传')
        imageData.url = await this.upload(pic.url)
      }
      imageData.salt = ''
      images.push(imageData)
    }
    return images
  }

  /* 
    加密模式下不存在远程图片，所有图片都是在本地
  */
  async _updateEncryptImage(card:ICard, key:string){
    const images:ICardImage[] = []
    for (const pic of card.image) {
      const imageData = {url:'',salt:'',hash:''}
      const originImageHash = pic.hash
      const originImageExtraData = await this.getExtraDataCache(pic)

      imageData.hash = await this.getHash(pic.url)
      // 图片hash一致并且附加数据一致就说明图片没改变
      if(originImageHash === imageData.hash && JSON.stringify(originImageExtraData) === JSON.stringify(card.info)){
        console.log('未检测到图片/附加数据修改，保持原始数据不做改变')
        if(!pic._url){
          throw new Error("更新出错，请重试")
        }
        imageData.salt = pic.salt
        imageData.url = pic._url
      }else{
        console.log('检测到图片/附加数据修改，重新加密上传')
        await this.checkImageType(pic.url)
        imageData.url = pic.url
        const encrytedPic = await this.encryptImage(imageData, card.info, key)
        imageData.url = await this.upload(encrytedPic.imagePath)
        imageData.salt = encrytedPic.imageSecretKey
      }
      images.push(imageData)
    }
    return images
  }

  async update({card, key}:{card:ICard, key:string}){
    const cardModel = this._createCardDefaultData(card)
    cardModel._id = card._id
    
    if(card.encrypted){
      cardModel.image =  await this._updateEncryptImage(card, key)
      cardModel.info = []
    }else{
      cardModel.image =  await this._updateNotEncryptImage(card)
    }

    return api.saveCard(cardModel)
  }

  async add({card, key}){
    const cardModel = this._createCardDefaultData(card)
    for (const pic of card.image) {
      const image: ICardImage = { url: pic.url, hash: '', salt: ''}
      await this.checkImageType(image.url)
      image.hash = await this.getHash(image.url)
      if(cardModel.encrypted){
        const encrytedImage = await this.encryptImage(image, cardModel.info, key)
        image.url = await this.upload(encrytedImage.imagePath)
        image.salt = encrytedImage.imageSecretKey
      }else{
        image.url = await this.upload(image.url)
      }
      cardModel.image!.push(image)
    }

    if(cardModel.encrypted){
      cardModel.info = []
    }

    return api.saveCard(cardModel)
  }

  _createCardDefaultData(card){
    const cardModel: Partial<ICard> = { image: [] }
    cardModel.encrypted = card.encrypted || false
    cardModel.title = card.title || '未命名'
    cardModel.tags = card.tags || ['其他']
    cardModel.info = card.info || []
    cardModel.setLike = card.setLike || false

    return cardModel
  }

  async encryptImage(image:ICardImage, extraData, key){
    if(!key) throw Error('密码不能为空')
    const keyPair = await this.crypto.createCommonKeyPair(key)
    const savePath = await this.getTempFilePath(image.hash)
    const options = {
      keyPair,
      imagePath: image.url,
      extraData,
      savePath
    }
    return this.crypto.encryptImage(options)
  }

  async decryptImage(image:ICardImage, key){
    if(!key) throw Error('密码不能为空')
    const keyPair = await this.crypto.createCommonKeyPair(key, image.salt)
    const savePath = await this.getDecryptedImageLocalSavePath(image)
    const imagePath = await this.downloadImage(image)
    const decryptedImage = await this.crypto.decryptImage({imagePath, savePath, keyPair})
    if(decryptedImage.extraData.length){
      await this.cacheExtraData(image, decryptedImage.extraData)
    }
    return {
      imagePath: decryptedImage.savePath,
      extraData: decryptedImage.extraData
    }
  }

  async downloadImage(image:ICardImage){
    const savePath = await this.getDownloadImageLocalSavePath(image)
    return this.downloadFile({
      url: image.url,
      savePath
    })
  }

  async getCardImage({image, key}){
    if(image.salt){
      try {
        return await this.getCardImageCache(image)
      } catch (error) {
        console.debug('未发现缓存数据，开始解密数据')
      }
      return this.decryptImage(image, key)
    }else{
      return {
        imagePath: image.url,
        extraData: []
      }
    }
  }

  async getCardImageCache(image: ICardImage){
    const cacheData = {
      imagePath: '',
      extraData: []
    }
    cacheData.imagePath = await this.getCardImagePathCache(image)
    cacheData.extraData = await this.getExtraDataCache(image)
    console.debug('命中缓存图片数据')
    return cacheData
  }
  // 检测并返回图片缓存的路径
  async getCardImagePathCache(image: ICardImage){
    const imagePath = await this.getDecryptedImageLocalSavePath(image)
    await file.checkAccess(imagePath)
    return imagePath
  }

  async _genCardImagePathName(image: {hash:string, salt?:string}){
    return `${image.hash}_${image.salt || 'ns' }`
  }

  async getDecryptedImageLocalSavePath(image: ICardImage){
    const name = await this._genCardImagePathName(image)
    return this.app.getLocalFilePath(name, 'dec')
  }

  async getDownloadImageLocalSavePath(image: ICardImage){
    const name = await this._genCardImagePathName(image)
    return this.app.getLocalFilePath(name, 'down')
  }

  async _removeCardImageCache(image: ICardImage){
    try {
      const path = await this.getDecryptedImageLocalSavePath(image)
      await file.deleteFile(path)
      console.debug('delete temp file:', path)
    } catch (_) {}

    try {
      const path = await this.getDownloadImageLocalSavePath(image)
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

  async getHash(imagePath:string): Promise<string>{
    const imageHash = await this.crypto.getFileHash(imagePath, 'MD5')
    console.debug('getHash: ',imagePath, imageHash)
    return imageHash
  }

  async upload(filePath){
    const uploadFileId = `${this.app.Config.uploadCardNamePrefix}/${this.app.user.openid}/${await this.crypto.randomHexString(16)}`
    return this.uploadFile(filePath, uploadFileId)
  }

  async uploadShare(filePath){
    const uploadFileId = `${this.app.Config.uploadShareCardNamePrefix}/${this.app.user.openid}/${await this.crypto.randomHexString(16)}`
    return this.uploadFile(filePath, uploadFileId)
  }

  async parseCardImageByRemoteApi(imagePath){
    await this.checkImageType(imagePath)
    const fileID = await this.uploadFile(imagePath,`tmp/pic-${imagePath.slice(-32)}`)
    const {fileID: fileUrl} = await api.captureCard(fileID)
    return fileUrl
  }

  async getExtraDataCache(image:ICardImage){
    const keyName = this._getExtraDataCacheKey(image)
    try {
      const cacheData = await getCache(LocalCacheKeyMap.CARD_EXTRA_DATA_CACHE_KEY)
      return cacheData[keyName] || []
    } catch (error) {
      return []
    }
  }

  _getExtraDataCacheKey(image:ICardImage){
    return `${image.hash}_${image.salt}`
  }

  // 渲染层业务接口
  async _getCardCache(){
    const cacheData = await this.getLocalData<{[id:string]:ICard}>(LocalCacheKeyMap.CARD_DATA_CACHE_KEY)
    return cacheData || {}
  }

  async _getCardItemCache(id:string){
    const cards = await this._getCardCache()
    if(cards[id]) return cards[id]
    return undefined
  }

  async _setCacheData(card:ICard){
    const cards = await this._getCardCache()
    cards[card._id] = card
    return this.setLocalData(LocalCacheKeyMap.CARD_DATA_CACHE_KEY,cards)
  }
  
  async fetch({id,forceUpdate}){
    let card = await this._getCardItemCache(id)
    if(forceUpdate || !card){
      card = await api.getCard({_id:id})
      await this._setCacheData(card)
    }
    return card
  }

  async clearCardItemCache(id:string){
    const cards = await this._getCardCache()
    delete cards[id]
    return this.setLocalData(LocalCacheKeyMap.CARD_DATA_CACHE_KEY,cards)
  }

  async setLike(params){
    return api.setCardLike(params)
  }

  async syncCheck(id){
    const cacheCard = await this._getCardItemCache(id)
    const remoteCard = await this.fetch({id,forceUpdate: true})
    return JSON.stringify(cacheCard) === JSON.stringify(remoteCard)
  }

  async cacheImage(image: ICardImage, useLocalFile: string){
    try {
      const destPath = await this.getDecryptedImageLocalSavePath(image)
      await file.copyFile(useLocalFile, destPath)
    } catch (error) {
      console.error(error)
    }
  }

  async cacheExtraData(image:ICardImage, data:any[]){
    const keyName = this._getExtraDataCacheKey(image)
    let cacheData = {}
    try {
      cacheData = await getCache(LocalCacheKeyMap.CARD_EXTRA_DATA_CACHE_KEY)
    } catch (error) {
      cacheData = {}
    }

    cacheData[keyName] = data
    return setCache(LocalCacheKeyMap.CARD_EXTRA_DATA_CACHE_KEY, cacheData)
  }

  async checkImageType(picPath){
    try {
      const imageType = await file.getImageType(picPath)
      if(!this.app.Config.allowUploadImageType.includes(imageType)) throw Error(` ${imageType} 图片格式不支持`)
    } catch (error) {
      console.error('image type check err:',error)
      throw Error('图片格式不支持')
    }
  }

  async parseCardImageByInternalApi(url){
    const { detectCardByContour, cv} = await require.async('../packages/opencv/index')
    // todo: 现在cv模块加载是异步的，没办法确认完成时间，后续要优化一下，手动实例化
    while (!cv.Mat) {
      await sleep(500)
    }
    const imageData = await this.getImageData(url)
    const src = cv.imread(imageData)
    const tempPath = await this.getTempFilePath('1234')
    const cardUrl = await detectCardByContour(src, tempPath)
    return cardUrl
  }
  // 返回图片 ImageData
  async getImageData(url){
    const offscreenCanvas = wx.createOffscreenCanvas({type: '2d'})
		const image = offscreenCanvas.createImage()
		await new Promise(function (resolve, reject) {
			image.onload = resolve
			image.onerror = reject
			image.src = url
    })
		offscreenCanvas.width = image.width;
		offscreenCanvas.height = image.height;
    const ctx = offscreenCanvas.getContext('2d')
    ctx.drawImage(image, 0, 0, image.width, image.height)
    return ctx.getImageData(0, 0, image.width, image.height)
  }
  
  async deleteCard(card: Partial<ICard>){
    // check local cache and remove
    await this.deleteCardCache(card)
    return api.deleteCard({_id: card._id})
  }

  async deleteCardCache(card: Partial<ICard>){
    // localStorage 附件字段和自身
    await this.clearCardItemCache(card._id!)
    // 图片
    return this.deleteCardImageCache(card)
  }

  async deleteCardImageCache(card: Partial<ICard>){
    for (const image of card.image!) {
      try {
        await this._removeCardImageCache(image)
      } catch (error) {
      }
    }
  }

  // 获取图片渲染数据
  async getImageRenderSetData(idx:number|string,card:ICard,keyName:string){
    const setData = {}
    if(card.encrypted){
      if(this.user.config?.general.autoShowContent){
        try {
          const picPath = await this.getCardImagePathCache(card.image[0])
          setData[`${keyName}[${idx}]._url`] = picPath
          setData[`${keyName}[${idx}]._showEncryptIcon`] = true
        } catch (error) {}
      }
    }else{
      try {
        let tempUrl:string
        if(card['firstImageTempUrl']){
          tempUrl = card['firstImageTempUrl']
        }else{
          tempUrl = await this.app.getCloudFileTempUrl(card.image[0].url)
        }
        if(tempUrl.startsWith('/')){// 获取云文件链接出错，使用本地占位图片替代      
          setData[`${keyName}[${idx}]._url`] = tempUrl
          setData[`${keyName}[${idx}]._mode`] = 'scaleToFill'
        }else{
          setData[`${keyName}[${idx}]._url`] = tempUrl + this.app.Config.imageMogr2
        }
      } catch (error) {}
    }
    return setData
  }
}

function getCardManager(){
  return CardManager.getInstance<CardManager>()
}

export {
  getCardManager
}