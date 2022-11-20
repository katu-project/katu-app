import utils,{ navigateTo, getCache, setCache, delCache, showChoose } from '@/utils/index'
import * as constData from '@/const'
import { AppConfig } from '@/config'
import api from '@/api'

class AppManager {
  static instance: AppManager
  Config = AppConfig
  api = api
  AppInfo = wx.getAccountInfoSync()
  Constant = constData

  user: Partial<IUser> = {}
  _masterKey: string = ''
  
  static getInstance(){
    if(!this.instance){
      this.instance = utils.selfish(new AppManager())
      this.instance.init()
    }
    return this.instance
  }

  init(){
    this.loadAppConfig()
  }

  get appVersion(){
    return this.AppInfo.miniProgram.version || 'develop'
  }
  get isDev(){
    return this.AppInfo.miniProgram.envVersion !== 'release'
  }

  get masterKey(){
    return this._masterKey
  }

  loadAppConfig(){
    this.rewriteConfig()
  }

  rewriteConfig(){
    wx.nextTick(()=>{
      this.loadDefaultTag()
    })
  }

  loadDefaultTag(){
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

  async syncUserTag(tags: ICardTag[]){
    this.user.customTag = tags
  }

  async setUserMasterKey(key: string){
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
    const masterKey = await this._fetchMasterKeyFromKeyPack(this.user.masterKeyPack?.keyPack, hexCode)
    if(!masterKey) throw Error("主密码错误")
    // 重新生成新的主密码包
    const masterKeyPack = await this._createMasterKeyPack(newHexCode, masterKey)
    // 更新主密码包
    return api.setMasterKeyInfo(masterKeyPack)
  }

  async loadUserInfo(){
    this.user = await api.getUser()
  }

  async loadUserConfig(){
    if(!this.user._id) {
      await this.loadUserInfo()
    }
    if(this.user.config?.security.rememberPassword){
      console.log("启用记住密码: 加载主密码");
      this._loadMasterKey()
    }
  }

  async reloadUserInfo(){
    this.user = await api.getUser()
  }

  async reloadUserConfig(configItem?:{key:string,value:string}){
    if(configItem){
      return utils.objectSetValue(this.user, configItem.key, configItem.value)
    }
    return this.reloadUserInfo()
  }

  async clearUserInfo(){
    this.user = await api.getUser() // 获取基础用户数据
    this.setMasterKey('')
  }

  async uploadUserAvatar(filePath){
    const s = new Date().getTime()
    return api.uploadAvatar(filePath, `user/${this.user.openid}/avatar/${s}`)
  }
  // user action end

  // master key section
  async _loadMasterKey(){
    if(!this.user.setMasterKey) return
    const masterKey = await this._readMasterKey()
    this.setMasterKey(masterKey) 
    
    if(this.masterKey) {
      try {
        this._verifyKey(this.masterKey, this.user.masterKeyPack?.keyId)
      } catch (error) {
        console.log('主密码不匹配，正常使用不应该出现这个问题！')
        await this.clearMasterKey()
      }
      console.log("加载主密码成功");
    }
  }

  async _readMasterKey(){
    try {
      const {data} = await getCache(this.Constant.MASTER_KEY_NAME)
      return data
    } catch (error) {
      console.log("读取主密码缓存失败");
    }
    return null
  }

  async clearMasterKey(){
    this.setMasterKey('')
    this._removeMasterKeyCache()
  }

  // 用户主密码导出原始主密码
  async loadMasterKeyWithKey(key){
    this.checkMasterKeyFormat(key)
    const hexCode = await this._convertToHex(key)
    const masterKey = await this._fetchMasterKeyFromKeyPack(this.user.masterKeyPack?.keyPack, hexCode)
    this.setMasterKey(masterKey)
  }

  async cacheMasterKey(){
    if(!this.masterKey) return
    return setCache(this.Constant.MASTER_KEY_NAME, this.masterKey)
  }

  async _removeMasterKeyCache(){
    return delCache(this.Constant.MASTER_KEY_NAME)
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

    if(!this.user.config?.security.rememberPassword && !this.masterKey){
      error.code = '21'
      error.message = '请输入主密码'
      throw error
    }

    if(!this.masterKey) {
      error.code = '20'
      error.message = '请输入主密码'
      throw error
    }

    try {
      this._verifyKey(this.masterKey, this.user.masterKeyPack?.keyId)
    } catch (err) {
      error.code = '22'
      error.message = '主密码不匹配'
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
  async _createMasterKeyPack(hexKey: string, masterKey ?: string){
    if(!masterKey){
      masterKey = await utils.crypto.random(16)
    }
    const keyPack: Partial<IMasterKeyPack> = {}
    keyPack.keyPack = utils.crypto.encryptString(masterKey, hexKey)
    keyPack.hexKeyId = this._calculateKeyId(hexKey)
    keyPack.keyId = this._calculateKeyId(masterKey)
    return keyPack
  }

  async _fetchMasterKeyFromKeyPack(masterPack, hexCode){
    const masterKey = utils.crypto.decryptString(masterPack, hexCode)
    if(!masterKey) throw Error("密码有误")
    return masterKey
  }

  setMasterKey(key){
    this._masterKey = key
  }

  _verifyKey(key, keyId){
    if(this._calculateKeyId(key) !== keyId){
      throw Error("密码错误")
    }
  }

  _calculateKeyId(key){
    return utils.crypto.sha1(key)
  }

  // master key section end

  async uploadFile(tempFilePath, saveName){
    const {fileID} = await wx.cloud.uploadFile({
      cloudPath: saveName,
      filePath: tempFilePath
    })
    return fileID
  }

  async downloadFile(pic: ICardImage){
    const savePath = `${this.Constant.APP_TEMP_DIR}/${pic.salt || new Date().getTime() }${constData.DOWNLOAD_IMAGE_CACHE_SUFFIX}`
    try {
      await utils.file.checkAccess(savePath)
      console.log('hit cache file, reuse it')
      return savePath
    } catch (error) {
      console.log('no cache file, download it')
    }
    const {fileList: [imageInfo]} = await wx.cloud.getTempFileURL({
      fileList: [pic.url]
    })
    console.warn('downloadFile:', imageInfo);
    const downloadFile = await utils.file.download(imageInfo.tempFileURL, savePath)
    return downloadFile.filePath
  }

  async previewImage(pics: string[], idx?:number){
    getApp().globalData.state.inPreviewPic = true
    wx.previewImage({
      urls: pics,
      current: pics[idx || 0]
    })
  }

  openUserUsageProtocol(){
    return this.navToDoc(this.Config.doc.userUsageProtocol)
  }

  openUserPrivacyProtocol(){
    return this.navToDoc(this.Config.doc.userPrivacyProtocol)
  }

  //数据备份
  exportCardData(){
    showChoose('温馨提示','由于小程序平台限制，导出数据功能需要前往卡兔web端操作。')
  }
  //数据备份结束

  //主密码备份/重置
  _generateRecoveryKeyWords(){
    return utils.bip39.generateMnemonic()
  }

  _generateRecoveryKey(){
    const words = this._generateRecoveryKeyWords()
    return utils.bip39.mnemonicToEntropy(words)
  }

  async generateRecoveryKeyQrcodeContent(){
    const rk = this._generateRecoveryKey()
    const qrContent = {
      i: (await utils.crypto.random(4)).toUpperCase(),
      t: new Date().toLocaleDateString(),
      rk
    }
    return qrContent
  }

  createRecoveryKeyPack(qrCodeData){
    if(!this.masterKey) throw Error("输入主密码")
    const keyPack: Partial<IRecoveryKeyPack> = {}
    keyPack.qrId = qrCodeData.i
    keyPack.createTime = qrCodeData.t
    keyPack.keyId = this._calculateKeyId(qrCodeData.rk)
    keyPack.pack = utils.crypto.encryptString(this.masterKey, qrCodeData.rk)
    return api.setRecoveryKey(keyPack)
  }

  _extractMasterKeyFromRecoveryKeyPack(recoveryKey){
    if(!this.user.recoveryKeyPack) throw Error("没有设置备份主密码")
    const masterKey = utils.crypto.decryptString(this.user.recoveryKeyPack.pack, recoveryKey)
    if(!masterKey) throw Error("密码有误")
    return masterKey
  }

  async extractRecoveryKeyFromQrcode(qrcode){
    try {
      const rk = JSON.parse(qrcode.result)
      return rk
    } catch (error) {
      throw Error("解析凭证数据出错!")
    }
  }

  async resetMasterKeyWithRecoveryKey({rk:recoveryKey, key}){
    this.checkMasterKeyFormat(key)
    const masterKey = this._extractMasterKeyFromRecoveryKeyPack(recoveryKey)
    const newHexCode = await this._convertToHex(key)
    // 重新生成新的主密码包
    const masterKeyPack = await this._createMasterKeyPack(newHexCode, masterKey)
    // 更新主密码包
    return api.setMasterKeyInfo(masterKeyPack)
  }

  //主密码备份/重置 结束
  navToDoc(id){
    navigateTo(`/pages/qa/detail/index?id=${id}`)
  }
  
  async getTempFilePath(cacheId:string, suffix?:string){
    return utils.file.getTempFilePath({
      dir: this.Constant.APP_TEMP_DIR,
      cacheId,
      suffix
    })
  }

  setHomeRefresh(){
    const pages = getCurrentPages()
    const homePage = pages.find(page=>page.route ===  `pages/${this.Constant.APP_ENTRY_PATH}`)
    if(!homePage) return
    homePage.backData = {refresh:true}
  }
}

function getAppManager(){
  return AppManager.getInstance()
}

export {
  getAppManager
}