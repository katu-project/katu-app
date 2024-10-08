import Controller from '@/class/controller'
import { getUserManager } from '@/controller/user'
import { getAppManager } from '@/controller/app'
import { file } from '@/utils/index'

class CardManager extends Controller{
  constructor(){
    super()
    this.init()
  }

  init(){
  }

  get user(){
    return getUserManager()
  }

  get app(){
    return getAppManager()
  }

  async _updateNotEncryptImage(images:ICardImage[]){
    const newImages:ICardImage[] = []
    for (const idx in images) {
      const pic = images[idx]
      const image = {url: '', salt:'', hash: '', ccv: ''}
      const originPicUrl = pic._url
      if(originPicUrl){
        if(pic.url === originPicUrl){
          image.url = pic.url
          image.hash = pic.hash
          console.log(`检测到卡面${idx}未修改，保持原始数据不做改变`)
        }else{
          image.hash = await this.getImageHash(pic.url)
          if(pic.hash === image.hash){
            console.log(`再次修改后的卡面${idx}与原图片hash一致，保持原始数据不做改变`)
            image.url = originPicUrl
          }else{
            await this.checkImageType(pic.url)
            console.log(`检测到卡面${idx}修改，重新上传`)
            image.url = await this.saveImageFile(pic.url)
          }
        }
      }else{  // 更新添加卡面
        console.log(`检测到新增卡面${idx}，重新保存卡片数据`)
        await this.checkImageType(pic.url)
        image.hash = await this.getImageHash(pic.url)
        image.url = await this.saveImageFile(pic.url)
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
      const image = {url:'',salt:'',hash:'', ccv:''}
      const originPicUrl = pic._url
      image.hash = await this.getImageHash(pic.url)

      if(originPicUrl && pic.hash === image.hash && !extraDataChange){
        console.log(`编辑卡面${idx}与原始Hash一致并且附加数据一致，保持原始数据不做改变`)
        image.salt = pic.salt
        image.url = originPicUrl
      }else{ 
        console.log(originPicUrl? `检测到卡面${idx}/附加数据修改，重新加密上传` : `检测到新增卡面${idx}，重新保存卡片数据`)
        await this.checkImageType(pic.url)
        image.url = pic.url
        const encrytedImage = await this.encryptImage(image, extraData, key)
        image.url = await this.saveImageFile(encrytedImage.path)
        image.salt = encrytedImage.keySalt
        image.ccv = encrytedImage.ccv
      }
      newImages.push(image)
    }
    return newImages
  }

  async save(options:{action:'save'|'update',card:Partial<ICard>, key:string, actionId?:string}){
    const { action, card, key, actionId } = options
    const cardModel: Partial<ICard> = { image: [] }
    cardModel.encrypted = card.encrypted || false
    cardModel.title = card.title || '未命名'
    cardModel.tags = card.tags || ['其他']
    cardModel.info = card.info || []
    cardModel.setLike = card.setLike || false

    const saveImage = async ({images, encrypted, info, key})=>{
      const savedImageList:ICardImage[] = []
      if(images?.length){
        for (const pic of images) {
          const image: ICardImage = { url: pic.url, hash: '', salt: '', ccv: ''}
          await this.checkImageType(image.url)
          image.hash = await this.getImageHash(image.url)
          if(encrypted){
            const encrytedImage = await this.encryptImage(image, info, key)
            image.url = await this.saveImageFile(encrytedImage.path)
            image.salt = encrytedImage.keySalt
            image.ccv = encrytedImage.ccv
          }else{
            image.url = await this.saveImageFile(image.url)
          }
          savedImageList.push(image)
        }
      }
      return savedImageList
    }

    const updateImage = async ({images, encrypted, info, key, id})=>{
      let updatedImageList:ICardImage[] = []
      if(encrypted){
        const originImageExtraData = JSON.stringify(await this.cache.getCardExtraData(id))
        updatedImageList = await this._updateEncryptImage(images, {
          extraData: info,
          extraDataChange: originImageExtraData !== JSON.stringify(info),
          key
        })
      }else{
        updatedImageList = await this._updateNotEncryptImage(images)
      }
      return updatedImageList
    }

    if(action === 'save'){
      cardModel.image = await saveImage({
        images: card.image,
        encrypted: cardModel.encrypted, 
        info: cardModel.info,
        key
      })
    }else{
      if(!card._id) throw Error('操作错误，请返回重试')
      cardModel._id = card._id
      cardModel.image = await updateImage({
        id: cardModel._id,
        images: card.image,
        encrypted: cardModel.encrypted, 
        info: cardModel.info,
        key
      })
    }

    if(cardModel.encrypted){
      cardModel.info = []
    }

    return this.invokeApi('saveCard', {
      card: cardModel,
      action,
      actionId
    })
  }

  async encryptImage(image:ICardImage, extraData, key:string){
    if(!key) throw Error('密码不能为空')
    const keyPair = await this.crypto.createCommonKeyPair({
      key
    })
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
    const keyPair = await this.crypto.createCommonKeyPair({
      key,
      salt: image.salt,
      ccv: image.ccv
    })
    const savePath = await this.getImageFilePath(image)
    const imagePath = await this.downloadImageFile(image)
    const decryptedImage = await this.crypto.decryptImage({
      imagePath,
      savePath,
      keyPair
    })
    return {
      imagePath: decryptedImage.savePath,
      extraData: decryptedImage.extraData
    }
  }

  async downloadImageFile(image: Pick<ICardImage,'url'>){
    const savePath = await this.getDownloadFilePath(image)
    if(this.storage.checkUseCustomStorage(image.url)){
      if(!this.user.config?.storage?.cos?.enable){
        throw Error('自定义存储未启用，无法获取卡片数据')
      }
      if(this.app.isMp){
        throw Error('小程序无法使用自定义存储，请使用 APP 操作')
      }
      const storageConfig = await this.user.getCustomStorageConfig(this.app.masterKeyManager.masterKey)
      return this.storage.downloadCardImage(image.url, savePath, storageConfig)
    }
    return this.downloadFile({
      url: image.url,
      savePath
    })
  }

  async saveImageFile(filePath){
    if(this.user.config?.storage?.cos?.enable){
      if(this.app.isMp){
        throw Error('小程序无法使用自定义存储，请使用 APP 操作')
      }
      const storageConfig = await this.user.getCustomStorageConfig(this.app.masterKeyManager.masterKey)
      return this.storage.saveCardImage(filePath, storageConfig)
    }
    return this.uploadCardFile(filePath)
  }

  // 渲染层业务接口
  async getCard({id, ignoreCache, key}:{id, ignoreCache?:boolean, key?:string}):Promise<ICard>{
    let card:ICard|undefined
    if(!ignoreCache){
      card = await this.cache.getCard(id)
    }

    if(!card){
      card = await this.invokeApi('getCard', {_id:id})
      if(!card) throw Error("卡片不存在")
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
            image._url = this.getConst('DefaultShowLockImage')
          }else{  // 普通图片未缓存则使用远程地址，并在后台缓存
            image._url = image.url
            this.cache.setCardImage(image, false)
          }
        }
      }
    }

    return card
  }

  async cacheCard(card:ICard, localCard:ICard){
    await this.cache.setCard(card)
    // cache card image
    for (const idx in card.image) {
      const image = card.image[idx]
      try {
        await this.cache.getCardImagePath(image)
        console.debug(`cacheCard: image ${image.hash} already cached`)
        continue
      } catch (_) {}

      image._url = localCard.image[idx].url

      await this.cache.setCardImage(image, card.encrypted)
    }

    // cache card extra data
    this.cache.setCardExtraData(card._id, localCard.info)
  }

  async deleteCard(card: Pick<ICard,'_id'|'image'>){
    await this.cache.deleteCard(card._id)
    await this.cache.deleteCardImage(card)
    return this.invokeApi('deleteCard', {_id: card._id})
  }

  async deleteCardImageCache(card: Pick<ICard,'_id'|'image'>){
    return this.cache.deleteCardImage(card)
  }

  async setLike(params){
    return this.invokeApi('setCardLike', params)
  }

  async syncCheck(id:string){
    const cacheCard = await this.cache.getCard(id)
    const remoteCard = await this.invokeApi('getCard', {_id:id})
    // todo: 优化数据变动检测
    return JSON.stringify(cacheCard) !== JSON.stringify(remoteCard)
  }

  async getList(params){
    const list = await this.invokeApi('getCardList', params)
    return list.map(card=>{
      if(card.encrypted){
        card._url = this.getConst('DefaultShowLockImage')
      }else{
        card._url = this.getConst('DefaultShowImage')
      }
      return card
    })
  }

  async parseCardImageBySelectRectangle(options:{imageData, points}){
    const { getCardFromPoints } = await require.async('../packages/opencv/index')
    const tempPath = await this.getTempFilePath(`cv-${this.currentTimestamp}`)
    const dstBuffer = await getCardFromPoints({
      imageData: options.imageData,
      pts: options.points,
      dstSize: {
        width: 1000,
        height: 630
      }
    })
    await file.writeFile(tempPath, dstBuffer)
    return tempPath
  }
  
  // 辅助方法
  condenseExtraFields(extraFields: ICardExtraField[]):[string,string][]{
    return extraFields.map(e=>{
      if(!(e.key && e.name && e.value)) throw Error('附加数据格式错误')
      return [e.key == 'cu'?`cu-${e.name}`:e.key,e.value!]
    })
  }

  rebuildExtraFields(extraFields: Partial<ICardExtraField>[]){
    return extraFields.map(item=>{
      const [key,cuName] = item[0].split('-')
      let extraField = Object.assign({value:''},this.getCardConfig('defaultFields').find(e=>e.key === key))
      extraField = Object.assign({name: '未知', value: '无'},extraField)
      if(key === 'cu') extraField.name = cuName
      extraField.value = item[1]
      return extraField
    })
  }

  // 获取图片渲染数据
  async getImageRenderSetData({idx,card,keyName}:{idx:number|string, card:ICard, keyName:string}){
    const cardDataKey = `${keyName}[${idx}]`
    const setData = {}

    if(keyName === 'list'){
      setData[`${cardDataKey}.cnText`] = '未设置卡号'
      setData[`${cardDataKey}.cn`] = ''
      setData[`${cardDataKey}.cvv`] = ''
  
      const extraData = await this.cache.getCardExtraData(card._id)
      setData[`${cardDataKey}.info`] = extraData
      if(extraData.length >= 1 && extraData[0][0] === 'cn' ){
        setData[`${cardDataKey}.cnText`] = extraData[0][1].match(/.{1,4}/g)?.join(' ')
        setData[`${cardDataKey}.cn`] = extraData[0][1]
      }
      if(extraData.length >= 2 && extraData[1][0] === 'cvv' ){
        setData[`${cardDataKey}.cvv`] = extraData[1][1]
      }
    }

    if(card.encrypted){
      setData[`${cardDataKey}._showEncryptIcon`] = true
      setData[`${cardDataKey}._url`] = this.getConst('DefaultShowLockImage')
    }

    try {
      setData[`${cardDataKey}._url`] = await this.cache.getCardImagePath(card.image[0])
    } catch (_) {
      if(card.encrypted){
        setData[`${cardDataKey}.cnText`] = '解密后查看卡号'
      }else{
        console.debug('未发现缓存图片，开始缓存', card._id)
        await this.cache.setCardImage(card.image[0], false)
        setData[`${cardDataKey}._url`] = await this.cache.getCardImagePath(card.image[0])
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