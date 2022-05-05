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
    console.log({data});
    const card = {id: data.id || '', encrypted: data.encrypted?1:0, image: [], info: {data:null} }
    for (const pic of data.image) {
      let imageData = {}
      // 有编辑
      if(!pic.url.startsWith('cloud://')){
        const uploadFileId = `${this.user.openid}/${pic.url.slice(-32)}`
        const imageHash = await this.getHash(pic.url)
        console.log("file hash: ", imageHash, pic.hash || '-');
        if(!pic.hash || pic.hash !== imageHash){ // 新增加或变动
          imageData.hash = imageHash
          if(card.encrypted){
            const tempFile = await this.encryptImage(pic.url)
            imageData.url = await this.app.uploadFile(tempFile.imagePath, uploadFileId)
            imageData.salt = tempFile.imageSecretKey
          }else{
            imageData.url = await this.app.uploadFile(pic.url, uploadFileId)
          }
        }else{
          throw Error("不应该进入这个分支")
        }
      }else{  // 图片没变动
        imageData = pic
        console.log('图片没变动');
      }
      
      card.image.push(imageData)
    }
    // return {}
    return saveCard(card)
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

  async decryptImage(card){
    const salt = card.salt
    const decryptImage = {
      imagePath: await utils.file.getTempFilePath(salt)
    }

    try {
      await utils.file.checkAccess(decryptImage.imagePath)
      console.log('hit cache decrypted file, reuse it')
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
    console.log(imageHexData.length, imageHexData.slice(0,32), imageHexData.slice(-32));
    return utils.crypto.md5(imageHexData)
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