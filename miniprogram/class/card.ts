import Base from '@/class/base'
import utils,{convert, getCache, setCache} from '@/utils/index'
import { KATU_MARK, LocalCacheKeyMap, PACKAGE_TAIL_LENGTH, WX_CLOUD_STORAGE_FILE_HEAD } from '@/const'
import api from '@/api'
import { copyFile, deleteFile } from '@/utils/file'
import { getAppManager } from '@/class/app'
import { getUserManager } from '@/class/user'
import { sleep } from '@/utils/base'

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
  async _updateEncryptImage(card:Partial<ICard>){
    const images:ICardImage[] = []
    for (const pic of card.image!) {
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
        imageData.url = pic._url!
      }else{
        console.log('检测到图片/附加数据修改，重新加密上传')
        const encrytedPic = await this.encryptImage(pic.url, card.info)
        imageData.url = await this.upload(encrytedPic.imagePath)
        imageData.salt = encrytedPic.imageSecretKey
      }
      images.push(imageData)
    }
    return images
  }

  async update(card:Partial<ICard>){
    const cardModel = this._createCardDefaultData(card)
    cardModel._id = card._id
    
    if(card.encrypted){
      cardModel.image =  await this._updateEncryptImage(card)
      cardModel.info = []
    }else{
      cardModel.image =  await this._updateNotEncryptImage(card)
    }

    return api.saveCard(cardModel)
  }

  async add(card){
    const cardModel = this._createCardDefaultData(card)
    
    for (const idx in card.image) {
      const pic = card.image[idx]
      const imageData = {url:'',salt:'',hash:''}

      if(pic.url.startsWith(WX_CLOUD_STORAGE_FILE_HEAD)){
        pic.url = await this.downloadImage(pic)
      }
      
      imageData.hash = await this.getHash(pic.url)
      if(cardModel.encrypted){
        const encrytedPic = await this.encryptImage(pic.url, cardModel.info)
        imageData.url = await this.upload(encrytedPic.imagePath)
        imageData.salt = encrytedPic.imageSecretKey
      }else{
        imageData.url = await this.upload(pic.url)
      }
      cardModel.image!.push(imageData)
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

  async getCardImage(card){
    if(card.salt){
      try {
        return await this.getCardImageCache(card)
      } catch (error) {
        console.debug('未发现缓存数据，开始解密数据')
      }
      return this.decryptImage(card)
    }else{
      return {
        imagePath: card.url,
        extraData: []
      }
    }
  }

  async getCardImageWithoutCache(image: ICardImage){
    if(image.salt){
      return this.decryptImage(image)
    }else{
      return {
        imagePath: image.url,
        extraData: []
      }
    }
  }

  async encryptImage(imagePath: string, extraData?: any[]){
    const keyPair = await this.generateKeypairWithMasterKey()
    return this._encryptImage({keyPair, imagePath, extraData})
  }

  async encryptImageWithKey(key:string, imagePath: string, extraData?: any[]){
    const keyPair = await this._generateKeypairByKey(key)
    return this._encryptImage({keyPair, imagePath, extraData})
  }

  async _encryptImage({keyPair, imagePath, extraData}: {keyPair: KeyPair, imagePath: string, extraData?: any[]}){
    const imageHexData = await utils.file.readFile(imagePath, 'hex')
    const {key:imageKey, salt} = keyPair
    const flag = '00000000'
    const extraDataInfo = this._packExtraData(extraData)
    
    const mixHexData = (imageHexData as string).concat(extraDataInfo.data)
    const encryptedData = utils.crypto.encryptFile(mixHexData, imageKey)
    
    const encryptPackage = encryptedData.concat(salt)
                                        .concat(flag).concat(extraDataInfo.lengthData)
                                        .concat(KATU_MARK)

    console.debug('encryptPackage:',encryptedData.length, encryptPackage.slice(-PACKAGE_TAIL_LENGTH), salt, imageKey)

    const hash = await this.getHash(imagePath)
    const savePath = await this.app.getTempFilePath(hash)

    await utils.file.writeFile(savePath, encryptPackage, 'hex')
    return {
      imageSecretKey: salt,
      imagePath: savePath
    }
  }

  async decryptImage(image:ICardImage){
    const salt = image.salt
    const {key} = await this.generateKeypairWithMasterKey({salt})
    return this._decryptImage(image, key)
  }

  async decryptImageWithKey(image:ICardImage, key:string){
    const {key: imageKey} = await this._generateKeypairByKey(key, {salt: image.salt})
    return this._decryptImage(image, imageKey)
  }

  async _decryptImage(image:ICardImage, key:string){
    const decryptImage:{imagePath: string, extraData: any[]} = {
      imagePath: await this.getDecryptedImageLocalSavePath(image),
      extraData: []
    }
    
    const imageFilePath = await this.downloadImage(image)
    const encryptedHexData = await utils.file.readFile(imageFilePath, 'hex')
    // 解密数据
    const metaData = encryptedHexData.slice(-PACKAGE_TAIL_LENGTH)
    const mixHexData = encryptedHexData.slice(0, -PACKAGE_TAIL_LENGTH)

    const decryptedData = utils.crypto.decryptFile(mixHexData, key)
    if(!decryptedData) throw Error("主密码错误")
    // 检测并解密附加数据
    const {data:extraData, dataLength: extraDataLength} = this._unpackExtraData(decryptedData, metaData)
    if(extraDataLength){
      decryptImage.extraData = extraData
      await this.cacheExtraData(image, extraData)
    }
    const imageData = extraDataLength?decryptedData.slice(0, -extraDataLength): decryptedData

    await utils.file.writeFile(decryptImage.imagePath, imageData, 'hex')
    return decryptImage
  }

  _packExtraData(extraData){
    const retDataInfo = {
      data: '',
      lengthData: '00000000'
    }
    extraData = JSON.stringify(extraData)
    if(extraData !== '[]') {
      const hexStr = convert.string2hex(extraData)
      retDataInfo.data = hexStr
      retDataInfo.lengthData = hexStr.length.toString().padStart(8,'0')
    }
    return retDataInfo
  }

  _unpackExtraData(mixHexData, metaData){
    const retDataInfo:{dataLength:number, data:any[]} = {
      dataLength: 0,
      data: []
    }
    const extraDataLength = parseInt(metaData.slice(-24,-16))
    if(extraDataLength){
      retDataInfo.dataLength = extraDataLength
      retDataInfo.data = JSON.parse(convert.hex2string(mixHexData.slice(-extraDataLength)))
    }
    return retDataInfo
  }

  async downloadImage(image:ICardImage){
    const savePath = await this.getDownloadImageLocalSavePath(image)
    return this.app.downloadFile({
      url: image.url,
      savePath
    })
  }

  async getCardImageCache(image: ICardImage){
    const cacheData = {
      imagePath: '',
      extraData: []
    }
    cacheData.imagePath = await this.getCardImagePathCache(image)
    cacheData.extraData = await this.getExtraDataCache(image)
    console.log('命中缓存数据: 已经存在相同解密数据')
    return cacheData
  }
  // 检测并返回图片缓存的路径
  async getCardImagePathCache(image: ICardImage){
    const imagePath = await this.getDecryptedImageLocalSavePath(image)
    await utils.file.checkAccess(imagePath)
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
      await deleteFile(path)
      console.debug('delete temp file:', path)
    } catch (_) {}

    try {
      const path = await this.getDownloadImageLocalSavePath(image)
      await deleteFile(path)
      console.debug('delete temp file:', path)
    } catch (_) {}

    // try delete temp file : 
    try {
      const path = await this.app.getTempFilePath(image.hash)
      await deleteFile(path)
      console.debug('delete temp file:', path)
    } catch (_) {}
  }

  async getHash(imagePath:string): Promise<string>{
    const imageHexData = await utils.file.readFile(imagePath, 'hex')
    const imageHash = utils.crypto.md5(imageHexData)
    console.debug('getHash: ',imagePath, imageHash, 'file:',`${imageHexData.slice(0,8)}...${imageHexData.slice(-8)}`);
    return imageHash
  }

  async upload(filePath){
    const uploadFileId = `${this.app.Config.uploadCardNamePrefix}/${this.app.user.openid}/${await utils.crypto.random(16)}`
    return this.app.uploadFile(filePath, uploadFileId)
  }

  async uploadShare(filePath){
    const uploadFileId = `${this.app.Config.uploadShareCardNamePrefix}/${this.app.user.openid}/${await utils.crypto.random(16)}`
    return this.app.uploadFile(filePath, uploadFileId)
  }

  generateKeypairWithMasterKey(options?){
    return this._generateKeypairByKey(this.app.masterKey, options)
  }

  _generateKeypairByKey(key:string, options?:{salt: string}){
    return utils.crypto.pbkdf2(key, { iterations: 5000, ...options })
  }

  async parseCardImageByRemoteApi(imagePath){
    await this.checkImageType(imagePath)
    const {fileID} = await wx.cloud.uploadFile({
      cloudPath: `tmp/pic-${imagePath.slice(-32)}`,
      filePath: imagePath
    })
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
      await copyFile(useLocalFile, destPath)
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
    const type = await utils.file.getImageType(picPath)
    if(!this.app.Config.allowUploadImageType.includes(type)) throw Error("图片类型不支持")
  }

  async parseCardImageByInternalApi(url){
    const { detectCardByContour, cv} = await require.async('../packages/opencv/index')
    // todo: 现在cv模块加载是异步的，没办法确认完成时间，后续要优化一下，手动实例化
    while (!cv.Mat) {
      await sleep(500)
    }
    const imageData = await this.getImageData(url)
    const src = cv.imread(imageData)
    const tempPath = await this.app.getTempFilePath('1234')
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