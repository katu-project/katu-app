import Base from '@/class/base'
import AppConfig from '@/config'
import api from '@/api'
import { sleep, file } from '@/utils/index'
import { DefaultShowLockImage } from '@/const'
import { getCryptoModule } from '@/module/crypto'
import { getCacheModule } from '@/module/cache'

class CardManager extends Base{
  constructor(){
    super()
    this.init()
  }

  init(){
  }

  get cache(){
    return getCacheModule()
  }

  get crypto(){
    return getCryptoModule()
  }

  async _updateNotEncryptImage(images:ICardImage[]){
    const newImages:ICardImage[] = []
    for (const idx in images) {
      const pic = images[idx]
      const image = {url: '', salt:'', hash: ''}
      const originPicUrl = pic._url
      if(originPicUrl){
        if(pic.url === originPicUrl){
          image.url = pic.url
          image.hash = pic.hash
          console.log(`检测到卡面${idx}未修改，保持原始数据不做改变`)
        }else{
          image.hash = await this.crypto.getImageHash(pic.url)
          if(pic.hash === image.hash){
            console.log(`再次修改后的卡面${idx}与原图片hash一致，保持原始数据不做改变`)
            image.url = originPicUrl
          }else{
            await this.checkImageType(pic.url)
            console.log(`检测到卡面${idx}修改，重新上传`)
            image.url = await this.upload(pic.url)
          }
        }
      }else{  // 更新添加卡面
        console.log(`检测到新增卡面${idx}，重新保存卡片数据`)
        await this.checkImageType(pic.url)
        image.hash = await this.crypto.getImageHash(pic.url)
        image.url = await this.upload(pic.url)
      }
      newImages.push(image)
    }
    return newImages
  }

  async _updateEncryptImage(images:ICardImage[], options){
    const {extraData, extraDataChange, key} = options
    const newImages:ICardImage[] = []
    for (const idx in images) {
      const pic = images[idx]
      const image = {url:'',salt:'',hash:''}
      const originPicUrl = pic._url
      image.hash = await this.crypto.getImageHash(pic.url)

      if(originPicUrl && pic.hash === image.hash && !extraDataChange){
        console.log(`编辑卡面${idx}与原始Hash一致并且附加数据一致，保持原始数据不做改变`)
        image.salt = pic.salt
        image.url = originPicUrl
      }else{ 
        console.log(originPicUrl? `检测到卡面${idx}/附加数据修改，重新加密上传` : `检测到新增卡面${idx}，重新保存卡片数据`)
        await this.checkImageType(pic.url)
        image.url = pic.url
        const encrytedPic = await this.encryptImage(image, extraData, key)
        image.url = await this.upload(encrytedPic.imagePath)
        image.salt = encrytedPic.imageSecretKey
      }
      newImages.push(image)
    }
    return newImages
  }

  async update({card, key}:{card:ICard, key:string}){
    const cardModel = this._createCardDefaultData(card)
    cardModel._id = card._id
    if(card.encrypted){
      const originImageExtraData = JSON.stringify(await this.cache.getCardExtraData(card._id))
      
      cardModel.image =  await this._updateEncryptImage(card.image, {
        extraData: card.info,
        extraDataChange: originImageExtraData === JSON.stringify(card.info),
        key
      })
      cardModel.info = []
    }else{
      cardModel.image =  await this._updateNotEncryptImage(card.image)
    }

    return api.saveCard(cardModel)
  }

  async add({card, key}){
    const cardModel = this._createCardDefaultData(card)
    for (const pic of card.image) {
      const image: ICardImage = { url: pic.url, hash: '', salt: ''}
      await this.checkImageType(image.url)
      image.hash = await this.crypto.getImageHash(image.url)
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

  async decryptImage(image:ICardImage, key:string){
    if(!key) throw Error('密码不能为空')
    const keyPair = await this.crypto.createCommonKeyPair(key, image.salt)
    const savePath = await this.getImageFilePath(image)
    const imagePath = await this.downloadImage(image)
    const decryptedImage = await this.crypto.decryptImage({imagePath, savePath, keyPair})
    return {
      imagePath: decryptedImage.savePath,
      extraData: decryptedImage.extraData
    }
  }

  async downloadImage(image: Pick<ICardImage,'url'>){
    return this.downloadFile({
      url: image.url,
      savePath: await this.getDownloadFilePath(image)
    })
  }

  async upload(filePath, type: 'card' | 'share' = 'card'){
    const uploadFileId = await api.getUploadFileId({type})
    return this.uploadFile(filePath, uploadFileId)
  }

  // 渲染层业务接口
  async getCard({id, ignoreCache, key}):Promise<ICard>{
    let card:ICard|undefined
    if(!ignoreCache){
      card = await this.cache.getCard(id)
    }

    if(!card){
      card = await api.getCard({_id:id})
      await this.cache.setCard(card)
    }

    for (const image of card.image) {
      if(card.encrypted && key){ // 解密图片
        const imageData =  await this.decryptImage(image, key)
        image._url = imageData.imagePath
        card.info = imageData.extraData
        if(card.info.length){
          await this.cache.setCardExtraData(id, imageData.extraData)
        }
      }else{ // 获取图片缓存
        try {
          image._url = await this.cache.getCardImagePath(image)
          if(card.encrypted){
            card.info = await this.cache.getCardExtraData(id)
          }
        } catch (_) {
          if(card.encrypted){
            image._url = DefaultShowLockImage
          }else{  // 普通图片未缓存则使用远程地址，并在后台缓存
            image._url = image.url
            this.cache.setCardImage(image, false)
          }
        }
      }
    }

    return card
  }

  async cacheCard(card:ICard, key?:string){
    // cache card info
    await this.cache.setCard(card)

    if(card.encrypted && !key) return
    // cache card image
    for (const image of card.image) {
      try {
        await this.cache.getCardImagePath(image)
        continue
      } catch (_) {}

      try {
        if(card.encrypted){
          const decryptedImage = await this.decryptImage(image, key!)
          image._url = decryptedImage.imagePath
          this.cache.setCardExtraData(card._id, decryptedImage.extraData)
        }else{
          this.cache.setCardExtraData(card._id, card.info)
        }
        await this.cache.setCardImage(image, card.encrypted)
      } catch (_) {}
    }

    // cache card extra data
    // this.cache.setCardExtraData(card.image[0], card.info)
  }

  async deleteCard(card: ICard){
    await this.cache.deleteCard(card._id)
    await this.deleteCardImageCache(card)
    return api.deleteCard({_id: card._id})
  }

  async deleteCardImageCache(card: ICard){
    await this.cache.deleteCardExtraData(card._id)
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

  async setLike(params){
    return api.setCardLike(params)
  }

  async syncCheck(id){
    const cacheCard = await this.cache.getCard(id)
    const remoteCard = await api.getCard({_id:id})
    return JSON.stringify(cacheCard) === JSON.stringify(remoteCard)
  }
  
  async checkImageType(picPath){
    try {
      const imageType = await file.getImageType(picPath)
      if(!AppConfig.allowUploadImageType.includes(imageType)) throw Error(` ${imageType} 图片格式不支持`)
    } catch (error) {
      console.error('image type check err:',error)
      throw Error('图片格式不支持')
    }
  }

  async parseCardImageByRemoteApi(imagePath){
    await this.checkImageType(imagePath)
    const fileID = await this.uploadFile(imagePath,`tmp/pic-${imagePath.slice(-32)}`)
    const {fileID: fileUrl} = await api.captureCard(fileID)
    return this.downloadImage({url: fileUrl})
  }

  async parseCardImageByInternalApi(url){
    const { detectCardByContour, cv} = await require.async('../packages/opencv/index')
    // todo: 现在cv模块加载是异步的，没办法确认完成时间，后续要优化一下，手动实例化
    while (!cv.Mat) {
      await sleep(500)
    }
    const imageData = await file.getImageData(url)
    const src = cv.imread(imageData)
    const tempPath = await this.getTempFilePath('1234')
    const cardUrl = await detectCardByContour(src, tempPath)
    return cardUrl
  }
  
  // 获取图片渲染数据
  async getImageRenderSetData({idx,card,keyName}:{idx:number|string, card:ICard, keyName:string}){
    const setData = {}

    try {
      const imagePath = await this.cache.getCardImagePath(card.image[0])
      setData[`${keyName}[${idx}]._url`] = imagePath
      if(card.encrypted){
        setData[`${keyName}[${idx}]._showEncryptIcon`] = true
      }
    } catch (_) {
      if(!card.encrypted){
        console.debug('未发现缓存图片，开始缓存', card._id)
        setData[`${keyName}[${idx}]._url`] = card.image[0].url
        this.cache.setCardImage(card.image[0], false)
      }
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