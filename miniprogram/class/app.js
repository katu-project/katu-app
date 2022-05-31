const utils = require('../utils/index')
const constData = require('../const')
const { getUser, removeAccount, usageStatistic } = require('../api')
const { APP_TEMP_DIR ,MASTER_KEY_NAME } = require('../const')
const DefaultUserData = {
  isActive: 0,
  quota: {
    cardCount: 1,
    encryptedCardCount: 0
  }
}

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

  async reloadUserInfo(){
    this.user = await getUser()
  }

  // user action
  async checkQuota(encrypted=false){
    const { canUseCardCount, canUseEncryptedCardCount } = await usageStatistic()
    if(encrypted && canUseEncryptedCardCount) return
    if(!encrypted && canUseCardCount) return
    throw Error('可使用卡片量不足')
  }

  async getUsageStatistic(){
    return usageStatistic()
  }

  async removeAccount(){
    return removeAccount()
  }
  clearUserInfo(){
    this.user = DefaultUserData
    this._masterKey = null
  }
  // user action
  // master key section

  async reloadMasterKey(){
    return this.loadMasterKey()
  }

  // 生成主密码 258 bite
  async createMasterKey(masterKeyHash){
    const masterKey = masterKeyHash
    const masterKeyId = masterKeyHash.slice(32)
    let masterCode = null
    try {
      const {randomValues} = await wx.getRandomValues({
        length: 16,
      })
      masterCode = utils.convert.BufferToHex(randomValues)
    } catch (error) {
      console.log('获取系统随机数出错：', error)
      masterCode = utils.crypto.random(16).toString()
    }
    const masterKeyPack = utils.crypto.encryptString(masterCode, masterKey)

    return {
      masterKeyId,
      masterKeyPack
    }
  }

  checkMasterKey(){
    const error = {
      code: '',
      message: ''
    }
    if(!this.user.setMasterKey){
      error.code = '01'
      error.message = '需要设置主密码才能启用加密功能'
      throw error
    }
    if(!this._masterKey) {
      error.code = '02'
      error.message = '请输入主密码'
      throw error
    }
  }

  async checkOriginMasterKey(originKey){
    if(!originKey || originKey.length < 6) throw Error("输入不符合密码要求")
    if(this.user.setMasterKey){
      const originKeyHash = utils.crypto.sha1(originKey)
      if(!originKeyHash.endsWith(this.user.masterKeyPack.masterKeyId)){
        throw Error("输入与已设置的主密码不匹配")
      }
    }
  }

  async createMasterKey(originKey){
    return utils.crypto.sha1(originKey)
  }

  // 根据用户原始密码解密出主密码 _masterKey
  async loadMasterKey(){
    if(!this.user.setMasterKey) return
    const originMasterKey = await this.readMasterKey()
    if(!originMasterKey) return
    this._masterKey = utils.crypto.decryptString(this.user.masterKeyPack.masterKeyPack,originMasterKey)
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

  async setMasterKey(hashKey){
    await wx.setStorage({
      key: MASTER_KEY_NAME,
      data: hashKey
    })
  }

  async checkSetAndReloadMasterKey(key){
    await this.checkOriginMasterKey(key)
    const masterKey = await this.createMasterKey(key)
    await this.setMasterKey(masterKey)
    return this.reloadMasterKey()
  }
  // master key section
  
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
  return utils.selfish(await AppManager.getInstance(...args))
}

module.exports = {
  getAppManager,
  DefaultUserData
}