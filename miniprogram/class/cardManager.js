const utils = require('../utils/index')
const { MASTER_KEY_NAME } = require('../const')

class CardManager {
  static instance = null
  masterKey = null
  static async getInstance(){
    if(!this.instance){
      this.instance = new CardManager()
      await this.instance.loadMasterKey()
    }
    return this.instance
  }

  async loadMasterKey(){
    this.masterKey = await this.readMasterKey()
  }

  async readMasterKey(){
    const {data} = await wx.getStorage({
      key: MASTER_KEY_NAME
    })
    return data
  }

  
  async encryptImage(imagePath){
    const imageHexData = await utils.file.readFile(imagePath, 'hex')
    console.log(11111,imageHexData.slice(0,32),imageHexData.length);
    const {key:imageKey, salt} = this.generateKeyByMasterKey()
    const encryptedData = utils.crypto.encryptImage(imageHexData, imageKey)
    console.log(11112,encryptedData.slice(0,32),encryptedData.length);
    const tempFilePath = await utils.file.getTempFilePath(salt)
    await utils.file.writeFile(tempFilePath, encryptedData)
    return {
      imageSecretKey: salt,
      imagePath: tempFilePath
    }
  }

  async decryptImage(imagePath, salt){
    const imageHexData = await utils.file.readFile(imagePath, 'utf-8')
    const {key:imageKey} = this.generateKeyByMasterKey({salt})
    const decryptedData = utils.crypto.decryptImage(imageHexData, imageKey)
    console.log(11111,decryptedData.slice(0,32),decryptedData.length);
    const tempFilePath = await utils.file.getTempFilePath(salt)
    await utils.file.writeFile(tempFilePath, decryptedData)
    return {
      imagePath: tempFilePath
    }
  }

  generateKeyByMasterKey(options){
    return utils.crypto.pbkdf2(this.masterKey, options)
  }
  
  async saveMasterKey(key){
    return wx.setStorage({
      key: MASTER_KEY_NAME,
      data: utils.crypto.sha512(key)
    })
  }
  
}

async function getCardManager(){
  return CardManager.getInstance()
}

module.exports = {
  getCardManager
}