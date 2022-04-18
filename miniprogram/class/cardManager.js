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
    // const imageHexData = await utils.file.readFile(imagePath, 'hex')
    const imageHexData = '010203040506'
    console.log('ihd1:',imageHexData.slice(0,16),imageHexData.length);
    const {key:imageKey, salt} = this.generateKeyByMasterKey()
    const encryptedData = utils.crypto.encryptImage(imageHexData, 'b9be2b9b216b1aab46aa95e34c010fe3')
    console.log('encode:', encryptedData,encryptedData.length);
    const tempFilePath = await utils.file.getTempFilePath(salt)
    await utils.file.writeFile(tempFilePath, encryptedData)

    return {
      imageSecretKey: salt,
      imagePath: encryptedData
    }
  }

  async decryptImage(imagePath, salt){
    // const imageHexData = await utils.file.readFile(imagePath, 'utf-8')
    const {key:imageKey} = this.generateKeyByMasterKey({salt:'2c3254c35505bd509758397fa780a294'})
    const decryptedData = utils.crypto.decryptImage(imagePath, imageKey)
    console.log('ihd2:',decryptedData.slice(0,16),decryptedData.length);
    return decryptedData
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