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
    try {
      const {data} = await wx.getStorage({
        key: MASTER_KEY_NAME
      })
      console.log('????',data);
      return data
    } catch (error) {
      throw Error("未设置主密码")
    }
  }

  
  async encryptImage(imagePath){
    const imageHexData = await utils.file.readFile(imagePath, 'hex')
    const {key:imageKey, salt} = this.generateKeyByMasterKey()
    const encryptedData = utils.crypto.encryptFile(imageHexData, imageKey)
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
    const decryptedData = utils.crypto.decryptFile(imageHexData, imageKey)
    const tempFilePath = await utils.file.getTempFilePath(salt)
    await utils.file.writeFile(tempFilePath, decryptedData, 'hex')
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
  
  async takePic(){
    try {
      const pics = await wx.chooseMedia({
        count: 1,
        mediaType: 'image'
      })
  
      if(!pics.tempFiles.length) return
      const tempFile = pics.tempFiles[0]
      return tempFile.tempFilePath
    } catch (error) {
      if(error?.errMsg === 'chooseMedia:fail cancel'){
        return
      }
      throw error
    }
  }

  async uploadFile(tempFilePath, saveName){
    const {fileID} = await wx.cloud.uploadFile({
      cloudPath: saveName,
      filePath: tempFilePath
    })
    return fileID
  }
}

async function getCardManager(){
  return CardManager.getInstance()
}

module.exports = {
  getCardManager
}