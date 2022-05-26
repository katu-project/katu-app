const utils = require('../utils/index')
const { KATU_MARK } = require('../const')
const { getAppManager } = require('./app')
const { saveCard, request } = require('../api')

class CardManager {
  static instance = null

  static async getInstance(){
    if(!this.instance){
      this.instance = new CardManager()
      await this.instance.init()
    }
    return this.instance
  }

  async init(){
    this.app = await getAppManager()
  }

  async update(card){
    const cardModel = {id: card.id, encrypted: card.encrypted, image: [], info: {card:null} }
    let noChange = !card.picCountChange
    for (const pic of card.image) {
      let imageData = {url:'',salt:'',hash:''}
      if(cardModel.encrypted){
        if(pic.salt){ // 保持加密
          const imageHash = await this.getHash(pic.url)
          if(pic.hash === imageHash){ //未变动
            console.log('加密图片无变动');
            imageData.hash = pic.hash
            imageData.salt = pic.salt
            imageData.url = pic.originUrl
          }else{ // 有变动
            console.log('加密图片有变动');
            const encryptedData = await this.encryptImage(pic.url)
            imageData.url = await this.upload(encryptedData.imagePath)
            imageData.salt = encryptedData.imageSecretKey
            imageData.hash = imageHash
            noChange = false
          }
        }else{ // 开启加密
          console.log('未加密图片开启加密');
          let localTempFile = pic.url
          if(pic.url.startsWith('cloud://')){ // 增加图片 case
            localTempFile = await this.app.downloadFile(pic)
          }
          const imageHash = await this.getHash(localTempFile)
          const encryptedData = await this.encryptImage(localTempFile)
          imageData.url = await this.upload(encryptedData.imagePath)
          imageData.salt = encryptedData.imageSecretKey
          imageData.hash = imageHash
          noChange = false
        }
      }else{
        if(pic.salt){ // 取消加密
          console.log('加密图片取消加密');
          const imageHash = await this.getHash(pic.url)
          imageData.salt = ''
          imageData.url = await this.upload(pic.url) // 重新上传图片获取链接
          imageData.hash = imageHash
          noChange = false
        }else{  // 未加密
          if(pic.url.startsWith('cloud://')){ // 未变动(一直未使用加密)
            console.log('未加密图片无变动');
            imageData.url = pic.url,
            imageData.hash = pic.hash
          }else{
            console.log('未加密图片有变动');
            const imageHash = await this.getHash(pic.url)
            imageData.url = await this.upload(pic.url)
            imageData.hash = imageHash
            noChange = false
          }
        }
      }

      cardModel.image.push(imageData)
    }

    if(noChange) return
    return saveCard(cardModel)
  }

  async add(card){
    this.app.checkMasterKey()
    const cardModel = {encrypted: card.encrypted?1:0, image: [], info: {card:null} }
    for (const pic of card.image) {
      let imageData = {url:'',salt:'',hash:''}
      
      if(pic.url.startsWith('cloud://')){
        pic.url = await this.app.downloadFile(pic)
        console.log('发现远程图片，保存到本地');
      }

      const imageHash = await this.getHash(pic.url)

      if(cardModel.encrypted){
        const encrytedPic = await this.encryptImage(pic.url)
        imageData.url = await this.upload(encrytedPic.imagePath)
        imageData.salt = encrytedPic.imageSecretKey
      }else{
        imageData.url = await this.upload(pic.url)
      }
      imageData.hash = imageHash
      cardModel.image.push(imageData)
    }
    return saveCard(cardModel)
  }

  async encryptImage(imagePath){
    const imageHexData = await utils.file.readFile(imagePath, 'hex')
    const {key:imageKey, salt} = this.generateKeyByMasterKey()
    const encryptedData = utils.crypto.encryptFile(imageHexData, imageKey)
    const flag = '000101'
    const encryptPackage = `${encryptedData}${salt}${flag}${KATU_MARK}`
    console.log('encryptPackage:', encryptPackage.slice(-38),salt);
    const tempFilePath = await utils.file.getTempFilePath(salt,'_enc')
    await utils.file.writeFile(tempFilePath, encryptPackage)
    return {
      imageSecretKey: salt,
      imagePath: tempFilePath
    }
  }

  async decryptImage(card){
    const salt = card.salt
    const decryptImage = {
      imagePath: await utils.file.getTempFilePath(salt,'_dec')
    }

    try {
      await utils.file.checkAccess(decryptImage.imagePath)
      console.log('hit cache decrypted file, reuse it:')
      return decryptImage
    } catch (error) {
      console.log('no cache decrypted file, decrypt it')
    }

    const imageFilePath = await this.app.downloadFile(card)
    const imageHexData = await utils.file.readFile(imageFilePath, 'utf-8')
    const {key:imageKey} = this.generateKeyByMasterKey({salt})
    const encryptedData = imageHexData.slice(0,-38)
    const decryptedData = utils.crypto.decryptFile(encryptedData, imageKey)
    await utils.file.writeFile(decryptImage.imagePath, decryptedData, 'hex')
    return decryptImage
  }

  async getHash(imagePath){
    const imageHexData = await utils.file.readFile(imagePath, 'hex')
    console.log('getHash: ',imagePath ,imageHexData.length, imageHexData.slice(0,32), imageHexData.slice(-32));
    return utils.crypto.md5(imageHexData)
  }

  async upload(filePath){
    const uploadFileId = `${this.app.Config.uploadCardNamePrefix}/${this.app.user.openid}/${utils.crypto.random(16)}`
    return this.app.uploadFile(filePath, uploadFileId)
  }

  generateKeyByMasterKey(options){
    return utils.crypto.pbkdf2(this.app.masterKey, options)
  }

  async choosePic(...args){
    return this.app.chooseFile(...args)
  }

  async parseCardImageByRemoteApi(imagePath){
    const {fileID} = await wx.cloud.uploadFile({
      cloudPath: `tmp/pic-${imagePath.slice(-32)}`,
      filePath: imagePath
    })
    const {fileID: fileUrl} = await request('user/captCard', {fileId: fileID})
    return fileUrl
  }
}

async function getCardManager(){
  return CardManager.getInstance()
}

module.exports = {
  getCardManager
}