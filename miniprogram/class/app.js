const utils = require('../utils/index')
const constData = require('../const')
const { getUser } = require('../api')
const { APP_TEMP_DIR ,MASTER_KEY_NAME } = require('../const')

class AppManager {
  static instance = null
  masterKey = null
  
  static async getInstance(options={}){
    if(!this.instance){
      this.instance = new AppManager()
      await this.instance.init()
    }
    return this.instance
  }
  async init(){
    this.user = await getUser()
    this.loadAppBaseInfo()
    this.loadAppConfig()
    this.loadConstant()
    this.loadMasterKey()
  }

  loadAppBaseInfo(){
    this.AppInfo = wx.getAccountInfoSync()
    this.appVersion = this.AppInfo.miniProgram.version || 'develop'
    this.isDev = this.AppInfo.miniProgram.envVersion !== 'release'
  }
  
  loadConstant(){
    this.Constant = constData
  }

  loadAppConfig(){
    this.Config = {
      uploadCardNamePrefix: 'card'
    }
  }

  checkMasterKey(){
    if(!this.user.hasSetMasterKey){
      throw Error("01")
    }
    if(!this.masterKey) {
      throw Error("02")
    }
  }
  
  async reloadMasterKey(){
    return this.loadMasterKey()
  }

  async reloadUserInfo(){
    this.user = await getUser()
  }

  async loadMasterKey(){
    this.masterKey = await this.readMasterKey()
  }

  async readMasterKey(){
    console.log("read Master Key");
    try {
      const {data} = await wx.getStorage({
        key: MASTER_KEY_NAME
      })
      return data
    } catch (error) {
      console.log("未设置主密码");
    }
    return null
  }

  
  async setMasterKey(key){
    const keyHash = utils.crypto.sha512(key)
    await wx.setStorage({
      key: MASTER_KEY_NAME,
      data: keyHash
    })
    await this.reloadMasterKey()
    return keyHash.slice(32)
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
    const savePath = `${APP_TEMP_DIR}/${pic.salt || new Date().getTime() }_down`
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
    console.warn('downloadFile:', imageInfo);
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