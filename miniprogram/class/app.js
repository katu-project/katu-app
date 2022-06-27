const utils = require('../utils/index')
const constData = require('../const')
const api = require('../api')

const { APP_TEMP_DIR ,MASTER_KEY_NAME } = require('../const')

class AppManager {
  static instance = null
  
  static getInstance(){
    if(!this.instance){
      this.instance = utils.selfish(new AppManager())
      this.instance.init()
    }
    return this.instance
  }
  async init(){
    this.loadAppBaseInfo()
    this.loadAppConfig()
    this.user = await api.getUser()
    this.loadConstant()
    if(!this.user.config.security.rememberPassword){
      this.loadMasterKey()
    }
  }

  loadAppBaseInfo(){
    this.api = api
    this.AppInfo = wx.getAccountInfoSync()
    this.appVersion = this.AppInfo.miniProgram.version || 'develop'
    this.isDev = this.AppInfo.miniProgram.envVersion !== 'release'
  }
  
  loadConstant(){
    this.Constant = constData
  }

  loadAppConfig(){
    this.Config = {
      uploadCardNamePrefix: 'card',
      allowUploadImageType: ['jpeg','png','jpg'],
      qaDocType: [{
        icon: 'apps',
        color: 'green',
        name: '功能',
        value: 'function'
      }, {
        icon: 'people',
        color: 'orange',
        name: '账户',
        value: 'account'
      }, {
        icon: 'safe',
        color: 'red',
        name: '安全',
        value: 'safe'
      }, {
        icon: 'vipcard',
        color: 'olive',
        name: '额度',
        value: 'quota'
      }, {
        icon: 'recharge',
        color: 'cyan',
        name: '费用',
        value: 'price'
      }, {
        icon: 'more',
        color: 'blue',
        name: '其他',
        value: 'other'
      }],
      imageMogr2: '&imageMogr2/thumbnail/100x/rquality/80/format/png/interlace/1/strip'
    }
    api.getDefaultTag().then(tags=>{
      this.Config.tags = tags
    })
  }

  // user action
  async checkQuota(encrypted=false){
    const { canUseCardCount, canUseEncryptedCardCount } = await api.usageStatistic()
    if(encrypted && canUseEncryptedCardCount) return
    if(!encrypted && canUseCardCount) return
    throw Error('可使用卡片量不足')
  }

  async syncUserTag(tags){
    this.user.customTag = tags
  }

  async setMasterKeyInfo(keyPack){
    return api.setMasterKeyInfo(keyPack)
  }

  async setUserMasterKey(masterKey){
    await this._checkInputMasterKey(masterKey)
    masterKey = await this.createMasterKey(masterKey)
    const masterKeyPack = await this.createMasterKeyPack(masterKey)
    return this.setMasterKeyInfo(masterKeyPack)
  }

  async updateUserMasterKey({masterKey, newMasterKey}){
    console.log(masterKey, newMasterKey);
    await this._checkInputMasterKey(masterKey)
    masterKey = await this.createMasterKey(masterKey)
    newMasterKey = await this.createMasterKey(newMasterKey)
    // 获取原始主密码
    const originMasterKey = await this.fetchOriginMasterFromMasterPack(this.user.masterKeyPack.keyPack, masterKey)
    if(!originMasterKey) throw Error("主密钥错误")
    // 重新生成新的主密码包
    const masterKeyPack = await this.createMasterPackWithOriginMasterKey(originMasterKey, newMasterKey)
    // 更新主密码包
    console.log(masterKeyPack);
    return this.setMasterKeyInfo(masterKeyPack)
  }

  async reloadUserInfo(){
    this.user = await api.getUser()
  }

  async loadUserConfig(configItem){
    if(configItem){
      return utils.objectSetValue(this.user, configItem.key, configItem.value)
    }
    return this.reloadUserInfo()
  }

  async getUsageStatistic(){
    return api.usageStatistic()
  }

  async removeAccount(){
    return api.removeAccount()
  }

  async clearUserInfo(){
    this.user = await api.getUser()
    this._masterKey = null
  }
  // user action
  // master key section

  async clearMasterKey(){
    this._masterKey = null
  }

  async reloadMasterKey(){
    return this.loadMasterKey()
  }

  // 生成主密码 256 bit
  async createMasterKeyPack(masterKey){
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

    return this.createMasterPackWithOriginMasterKey(masterCode, masterKey)
  }

  checkMasterKey(){
    const error = {
      code: '',
      message: ''
    }
    if(!this.user.setMasterKey){
      error.code = '10'
      error.message = '还未设置主密码'
      throw error
    }

    if(!this.user.config.security.rememberPassword && !this._masterKey){
      error.code = '21'
      error.message = '请输入主密码'
      throw error
    }

    if(!this._masterKey) {
      error.code = '20'
      error.message = '请输入主密码'
      throw error
    }
  }

  async _checkInputMasterKey(masterKey){
    if(!masterKey || masterKey.length < 6) throw Error("主密码错误")
    if(this.user.setMasterKey){
      masterKey = await this.createMasterKey(masterKey)
      const masterKeyId = await this.generateMasterKeyId(masterKey)
      if(masterKeyId !== this.user.masterKeyPack.keyId){
        throw Error("主密码错误")
      }
    }
  }

  async createMasterKey(originKey){
    return utils.crypto.sha1(originKey)
  }

  async loadMasterKeyWithKey(key){
    await this._checkInputMasterKey(key)
    const masterKey = await this.createMasterKey(key)
    this._masterKey = await this.fetchOriginMasterFromMasterPack(this.user.masterKeyPack.keyPack, masterKey)
  }

  // 根据用户原始密码解密出主密码 _masterKey
  async loadMasterKey(){
    if(!this.user.setMasterKey) return
    const masterKey = await this.readMasterKey()
    if(!masterKey) return
    this._masterKey = await this.fetchOriginMasterFromMasterPack(this.user.masterKeyPack.keyPack, masterKey)
  }

  async fetchOriginMasterFromMasterPack(masterPack, key){
    console.log({masterPack, key});
    const originMasterKey = utils.crypto.decryptString(masterPack, key)
    if(!originMasterKey) throw Error("主密钥错误")
    return originMasterKey
  }

  async createMasterPackWithOriginMasterKey(originMasterkey, masterKey){
    const keyPack = {}
    keyPack.keyPack = utils.crypto.encryptString(originMasterkey, masterKey)
    keyPack.keyId = await this.generateMasterKeyId(masterKey)
    return keyPack
  }

  async generateMasterKeyId(masterKey){
    return masterKey.slice(32)
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
    await this._checkInputMasterKey(key)
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

function getAppManager(...args){
  return AppManager.getInstance(...args)
}

module.exports = {
  getAppManager
}