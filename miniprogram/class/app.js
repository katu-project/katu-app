const utils = require('../utils/index')
const { APP_TEMP_DIR ,MASTER_KEY_NAME } = require('../const')

class AppManager {
  static instance = null
  masterKey = null
  static async getInstance(options){
    if(!this.instance){
      this.instance = new AppManager()
      if(!options?.setMasterKey){
        await this.instance.loadMasterKey()
      }
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
      return data
    } catch (error) {
      throw Error("未设置主密码")
    }
  }

  
  async saveMasterKey(key){
    return wx.setStorage({
      key: MASTER_KEY_NAME,
      data: utils.crypto.sha512(key)
    })
  }
  
  
  async chooseFile(){
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

  async downloadFile(pic){
    const savePath = `${APP_TEMP_DIR}/${pic.salt||'temp'}_down`
    try {
      await utils.file.checkAccess(savePath)
      console.log('hit cache file, reuse it')
      return savePath
    } catch (error) {
      console.log('no cache file, download it')
    }
    const {fileList: [imageInfo]} = await wx.cloud.getTempFileURL({
      fileList: [{
        fileID: pic.url
      }]
    })
    console.log('downloadFile:', imageInfo);
    const downloadFile = await utils.file.download(imageInfo.tempFileURL, savePath)
    return downloadFile.filePath
  }
}

async function getAppManager(...args){
  return AppManager.getInstance(...args)
}

module.exports = {
  getAppManager
}