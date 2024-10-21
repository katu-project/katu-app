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

  async saveImage({imageLocalPath, info}){
    const saveImageItem: ICardImage = { 
      url: imageLocalPath, 
      hash: '',
      salt: '', 
      ccv: ''
    }
    const saveImageFile = async(filePath:string) => {
      if(this.user.config?.storage?.cos?.enable){
        if(this.app.isMp){
          throw Error(this.t_e('mp_use_cs'))
        }
        const storageConfig = await this.user.getCustomStorageConfig(this.app.masterKeyManager.masterKey)
        return this.storage.saveCardImage(filePath, storageConfig)
      }
      return this.uploadCardFile(filePath)
    }
    await this.checkImageType(saveImageItem.url)
    saveImageItem.hash = await this.getImageHash(saveImageItem.url)
    const encrytedImage = await this.encryptImage(saveImageItem, info, this.app.masterKeyManager.masterKey)
    saveImageItem.url = await saveImageFile(encrytedImage.path)
    saveImageItem.salt = encrytedImage.keySalt
    saveImageItem.ccv = encrytedImage.ccv
    return saveImageItem
  }

  async save(options:{card:Partial<ICard>, images}){
    const { card, images } = options
    if(!images.length) throw Error(this.t_e('no_card_image'))

    const cardModel: Partial<ICard> = { image: images }
    cardModel.encrypted = true
    cardModel.title = card.title || ''
    cardModel.tags = card.tags || []
    cardModel.info = []
    cardModel.setLike = card.setLike || false
    if(card._id){
      cardModel._id = card._id
    }
    return this.invokeApi('saveCard', {
      card: cardModel,
      action: ''
    })
  }

  async encryptImage(image:ICardImage, extraData, key:string){
    if(!key) throw Error(this.t_e('bad_key'))
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
    if(!key) throw Error(this.t_e('empty_key'))
    const keyPair = await this.crypto.createCommonKeyPair({
      key,
      salt: image.salt,
      ccv: image.ccv
    })
    const downloadImageFile = async (image: Pick<ICardImage,'url'>) => {
      const savePath = await this.getDownloadFilePath(image)
      if(this.storage.checkUseCustomStorage(image.url)){
        if(!this.user.config?.storage?.cos?.enable){
          throw Error(this.t_e('cs_not_enable'))
        }
        if(this.app.isMp){
          throw Error(this.t_e('mp_use_cs'))
        }
        const storageConfig = await this.user.getCustomStorageConfig(this.app.masterKeyManager.masterKey)
        return this.storage.downloadCardImage(image.url, savePath, storageConfig)
      }
      return this.downloadFile({
        url: image.url,
        savePath
      })
    }
    const savePath = await this.getImageFilePath(image)
    const imagePath = await downloadImageFile(image)
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

  // ui render
  async getCard({id, ignoreCache, decrypt}:{id, ignoreCache?:boolean, decrypt?:boolean}):Promise<ICard>{
    let card:ICard|undefined
    if(!ignoreCache){
      card = await this.cache.getCard(id)
    }

    if(!card){
      card = await this.invokeApi('getCard', {_id:id})
      if(!card) throw Error(this.t_e('card_not_exist'))
      await this.cache.setCard(card)
    }

    for (const image of card.image) {
      if(decrypt){
        const imageData =  await this.decryptImage(image, this.app.masterKeyManager.masterKey)
        image._url = imageData.imagePath
        card.info = imageData.extraData
        if(card.info.length){
          // two pic will repeat set
          await this.cache.setCardExtraData(id, imageData.extraData)
        }
      }else{ // todo: need remove 
        try {
          image._url = await this.cache.getCardImagePath(image)
          if(card.encrypted){
            card.info = await this.cache.getCardExtraData(id)
          }
        } catch (_) {
          if(card.encrypted){
            image._url = this.getConst('DefaultShowLockImage')
          }else{
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
    // todo: need refine data change check
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
    try {
      const dstBuffer = await getCardFromPoints({
        imageData: options.imageData,
        pts: options.points,
        dstSize: {
          width: 1000,
          height: 630
        }
      })
      await file.writeFile(tempPath, dstBuffer)
    } catch (error) {
      console.error('func parseCardImageBySelectRectangle: ', error)
      throw Error(this.t_e('opencv_select_card_error'))
    }
    return tempPath
  }
  
  // extra data helper
  condenseExtraFields(extraFields: ICardExtraField[]):[string,string][]{
    return extraFields.map(e=>{
      if(!(e.key && e.name && e.value)) throw Error(this.t_e('extra_data_format'))
      return [e.key == 'cu'?`cu-${e.name}`:e.key,e.value!]
    })
  }

  rebuildExtraFields(extraFields: Partial<ICardExtraField>[]){
    const defaultExtraFields = this.getCardConfig('defaultFields').map(e=>{
      e.name = this.t(e.key,[],'extraData')
      return e
    })
    return extraFields.map(item=>{
      const [key,cuName] = item[0].split('-')
      let extraField = Object.assign({value:''}, defaultExtraFields.find(e=>e.key === key))
      extraField = Object.assign({name: '', value: ''},extraField)
      if(key === 'cu') extraField.name = cuName
      extraField.value = item[1]
      return extraField
    })
  }

  async getImageRenderSetData({idx,card,keyName}:{idx:number|string, card:ICard, keyName:string}){
    const cardDataKey = `${keyName}[${idx}]`
    const setData = {}

    if(keyName === 'list'){
      setData[`${cardDataKey}.cnText`] = this.t('not_set_id', [], 'card')
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
        setData[`${cardDataKey}.cnText`] = this.t('show_after_decrypt',[],'card')
      }else{
        console.debug('no cache image find, start cache:', card._id)
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