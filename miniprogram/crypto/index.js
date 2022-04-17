const utils = require('../utils/index')
const { MASTER_KEY_NAME } = require('../const')

class CryptoManager {
  static instance = null
  masterKey = null
  static async getInstance(){
    if(!this.instance){
      this.instance = new CryptoManager()
      await this.instance.loadMasterKey()
    }
    return this.instance
  }

  async loadMasterKey(){
    this.masterKey = this.readMasterKey()
  }

  async readMasterKey(){
    const {data} = await wx.getStorage({
      key: MASTER_KEY_NAME
    })
    return data
  }

  
  async encryptImage(imagePath){
    const imageHexData = await readFile(imagePath, 'hex')
    const {key:imageKey, salt} = utils.crypto.pbkdf2(this.masterKey)
    const encryptedJson = await utils.crypto.encryptImage(imageHexData, imageKey)

    const tempFilePath = await getTempFilePath(imageKey)
    await utils.file.writeFile(tempFilePath, JSON.stringify(encryptedJson))

    return {
      imageSecretKey: salt,
      encryptedImageTempPath: tempImagePath
    }
  }

  async decryptImage(imagePath){
    return tempImagePath
  }

  async generateKeyByMasterKey(){
    const masterKey = await wx.getStorage({
      key: MASTER_KEY_NAME
    })
    return utils.crypto.pbkdf2(masterKey)
  }
  
  async saveMasterKey(key){
    return wx.setStorage({
      key: MASTER_KEY_NAME,
      data: utils.crypto.sha512(key)
    })
  }
  
}

async function getCryptoManager(){
  return CryptoManager.getInstance()
}

module.exports = {
  getCryptoManager
}