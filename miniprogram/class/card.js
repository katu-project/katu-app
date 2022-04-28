const utils = require('../utils/index')
const { KATU_MARK } = require('../const')
const { getUser, saveCard } = require('../api')
const { getAppManager } = require('./app')

class CardManager {
  static instance = null

  static async getInstance(){
    if(!this.instance){
      this.instance = new CardManager()
      this.instance.app = await getAppManager()
      this.instance.user = await getUser()
    }
    return this.instance
  }
  
  async save(data){
    const card = { encrypted: data.encrypted?1:0, image: [], info: {data:null} }
    for (const pic of data.pic) {
      let imageData = {}
      const uploadFileId = `${this.user.openid}/${pic.url.slice(-32)}`
      if(card.encrypted){
        const tempFile = await this.encryptImage(pic.url)
        imageData.url = await this.app.uploadFile(tempFile.imagePath, uploadFileId)
        imageData.salt = tempFile.imageSecretKey
      }else{
        imageData.url = await this.app.uploadFile(pic.url, uploadFileId)
      }
      card.image.push(imageData)
    }

    // return saveCard(card)
  }

  async encryptImage(imagePath){
    const imageHexData = await utils.file.readFile(imagePath, 'hex')
    const {key:imageKey, salt} = this.generateKeyByMasterKey()
    const encryptedData = utils.crypto.encryptFile(imageHexData, imageKey)
    const flag = '000101'
    const encryptPackage = `${encryptedData}${salt}${flag}${KATU_MARK}`
    console.log('encryptPackage:', encryptPackage.slice(-38),salt);
    const tempFilePath = await utils.file.getTempFilePath(salt)
    await utils.file.writeFile(tempFilePath, encryptPackage)
    return {
      imageSecretKey: salt,
      imagePath: tempFilePath
    }
  }

  async decryptImage(imagePath, salt){
    const imageHexData = await utils.file.readFile(imagePath, 'utf-8')
    const {key:imageKey} = this.generateKeyByMasterKey({salt})
    const encryptedData = imageHexData.slice(0,-38)
    const decryptedData = utils.crypto.decryptFile(encryptedData, imageKey)
    const tempFilePath = await utils.file.getTempFilePath(salt)
    await utils.file.writeFile(tempFilePath, decryptedData, 'hex')
    return {
      imagePath: tempFilePath
    }
  }

  generateKeyByMasterKey(options){
    return utils.crypto.pbkdf2(this.app.masterKey, options)
  }

  async choosePic(...args){
    return this.app.chooseFile(...args)
  }
}

async function getCardManager(){
  return CardManager.getInstance()
}

module.exports = {
  getCardManager
}