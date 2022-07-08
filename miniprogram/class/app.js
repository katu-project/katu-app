const utils = require('../utils/index')
const constData = require('../const')
const api = require('../api')

const { APP_TEMP_DIR ,MASTER_KEY_NAME } = require('../const')
const { navigateTo } = require('../utils/index')

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
    if(this.user.config.security.rememberPassword){
      this._loadMasterKey()
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
        icon: 'settings',
        color: 'cyan',
        name: '设置',
        value: 'setting'
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
        icon: 'more',
        color: 'blue',
        name: '其他',
        value: 'other'
      }],
      tags: [
        { name: '储蓄卡' },
        { name: '信用卡' },
        { name: '购物卡' },
        { name: '名片' },
        { name: '其他' }
      ],
      imageMogr2: '&imageMogr2/thumbnail/100x/rquality/80/format/png/interlace/1/strip'
    }
    api.getDefaultTag().then(tags=>{
      this.Config.tags = tags
    }).catch(console.log)
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

  async setUserMasterKey(key){
    const hexCode = await this._convertToHex(key)
    const masterKeyPack = await this._createMasterKeyPack(hexCode)
    return api.setMasterKeyInfo(masterKeyPack)
  }

  async updateUserMasterKey({key, newKey}){
    this.checkMasterKeyFormat(key)
    this.checkMasterKeyFormat(newKey)
    const hexCode = await this._convertToHex(key)
    const newHexCode = await this._convertToHex(newKey)
    // 获取主密码
    const masterKey = await this._fetchMasterKeyFromKeyPack(this.user.masterKeyPack.keyPack, hexCode)
    if(!masterKey) throw Error("主密码错误")
    // 重新生成新的主密码包
    const masterKeyPack = await this._createMasterKeyPack(newHexCode, masterKey)
    // 更新主密码包
    return api.setMasterKeyInfo(masterKeyPack)
  }

  async reloadUserInfo(){
    this.user = await api.getUser()
  }

  async reloadUserConfig(configItem){
    if(configItem){
      return utils.objectSetValue(this.user, configItem.key, configItem.value)
    }
    return this.reloadUserInfo()
  }

  async clearUserInfo(){
    this.user = await api.getUser() // 获取基础用户数据
    this._masterKey = null
  }

  async uploadUserAvatar(filePath){
    const s = new Date().getTime()
    return api.uploadAvatar(filePath, `user/${this.user.openid}/avatar/${s}`)
  }
  // user action end

  // master key section
  async _loadMasterKey(){
    if(!this.user.setMasterKey) return
    this._masterKey = await this._readMasterKey()
    console.log("加载主密码成功");
  }

  async _readMasterKey(){
    try {
      const {data} = await wx.getStorage({
        key: MASTER_KEY_NAME
      })
      return data
    } catch (error) {
      console.log("读取主密码缓存失败");
    }
    return null
  }

  async clearMasterKey(){
    this._masterKey = null
    this._removeMasterKeyCache()
  }

  async loadMasterKeyWithKey(key){
    this.checkMasterKeyFormat(key)
    const hexCode = await this._convertToHex(key)
    this._masterKey = await this._fetchMasterKeyFromKeyPack(this.user.masterKeyPack.keyPack, hexCode)
  }

  async cacheMasterKey(){
    if(!this._masterKey) return
    await wx.setStorage({
      key: MASTER_KEY_NAME,
      data: this._masterKey
    })
  }

  async _removeMasterKeyCache(){
    return wx.removeStorage({
      key: MASTER_KEY_NAME
    })
  }

  // 使用前检测主密码状态
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

  checkMasterKeyFormat(key){
    if(!key || key.length < 6) throw Error("格式错误")
  }

  async _convertToHex(key){
    const hexCode = utils.crypto.sha1(key)
    if(!hexCode) throw Error("主密码生成出错，请联系客服")
    return hexCode
  }

  // 生成主密码 256 bit
  async _createMasterKeyPack(hexKey, masterKey){
    if(!masterKey){
      try {
        const {randomValues} = await wx.getRandomValues({
          length: 16,
        })
        masterKey = utils.convert.BufferToHex(randomValues)
      } catch (error) {
        console.log('获取系统随机数出错，将使用内置替代库：', error)
        masterKey = utils.crypto.random(16).toString()
      }
    }
    const keyPack = {}
    keyPack.keyPack = utils.crypto.encryptString(masterKey, hexKey)
    keyPack.keyId = await this._generateMasterKeyId(hexKey)
    return keyPack
  }

  async _fetchMasterKeyFromKeyPack(masterPack, hexCode){
    const masterKey = utils.crypto.decryptString(masterPack, hexCode)
    if(!masterKey) throw Error("主密码错误")
    return masterKey
  }

  async _generateMasterKeyId(key){
    return utils.crypto.sha1(key)
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

  navToDoc(id){
    navigateTo(`/pages/qa/detail/index?id=${id}`)
  }
}

function getAppManager(...args){
  return AppManager.getInstance(...args)
}

module.exports = {
  getAppManager
}