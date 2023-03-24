import '@/utils/override'
import Base from './base'
import api from '@/api'
import AppConfig from '@/config'
import { crypto, navigateTo, showChoose, chooseLocalImage, switchTab, mergeDeep, sleep, file, bip39 } from '@/utils/index'
import { APP_TEMP_DIR, APP_DOWN_DIR, APP_IMAGE_DIR, DefaultLoadFailedImage, LocalCacheKeyMap, APP_ENTRY_PATH, APP_ROOT_DIR } from '@/const'
import { getCardManager } from './card'
import { getUserManager } from './user'
import { getNoticeModule } from '@/module/notice'
import { getCryptoModule } from '@/module/crypto'
import { getCacheModule } from '@/module/cache'

class AppManager extends Base {
  Config = AppConfig
  AppInfo = wx.getAccountInfoSync()
  DeviceInfo: Partial<WechatMiniprogram.SystemInfo> = {}
  _masterKey: string = ''

  lastNoticeFetchTime: number = 0

  constructor(){
    super()
  }

  async init(){
    this.loadBaseInfo()
    this.loadConfig()
    await this.loadModules()
    return
  }

  get version(){
    return this.AppInfo.miniProgram.version || 'develop'
  }

  get isDev(){
    return this.AppInfo.miniProgram.envVersion !== 'release'
  }

  get platform(){
    return this.DeviceInfo.platform
  }

  get user(){
    return getUserManager()
  }

  get cardManager(){
    return getCardManager()
  }

  get masterKey(){
    return this._masterKey
  }

  // modules
  get notice(){
    return getNoticeModule()
  }

  get crypto(){
    return getCryptoModule()
  }

  get cache(){
    return getCacheModule()
  }

  // modules end

  loadBaseInfo(){
    wx.getSystemInfoAsync({
      success: info => {
        this.DeviceInfo = info
        console.debug(info)
      }
    })
  }

  loadConfig(){
    this.rewriteConfig()
  }

  rewriteConfig(){
    wx.nextTick(()=>{
      setTimeout(()=>{
        this.loadDefaultTag()
      },3000)
    })
  }

  loadDefaultTag(){
    api.getDefaultTag().then(tags=>{
      this.Config.tags = tags
    }).catch(console.warn)
  }

  async loadModules(){
    if(!this.cache.inited){
      await this.cache.init({
        homeDataCacheTime: this.Config[this.isDev ? 'devHomeDataCacheTime' : 'homeDataCacheTime']
      })
    }
    this.notice.init()
    if(!this.user.config?.crypto) { 
      setTimeout(this.loadModules.bind(this), 1000)
      return
    }
    getCryptoModule().init(mergeDeep(this.Config.cryptoConfig, this.user.config.crypto))
  }
  // user section
  async setUserMasterKey(key: string){
    const hexCode = this.crypto.convertToHexString(key)
    const masterKeyPack = await this.crypto.createCommonKeyPack(hexCode)
    return api.setMasterKeyInfo(masterKeyPack)
  }

  async updateUserMasterKey({key, newKey}){
    const hexCode = this.crypto.convertToHexString(key)
    const newHexCode = this.crypto.convertToHexString(newKey)
    if(!this.user.masterKeyPack?.keyPack) throw Error('未设置主密码')
    // 获取主密码
    const masterKey = await this.crypto.fetchKeyFromKeyPack(this.user.masterKeyPack.keyPack, hexCode)
    // 重新生成新的主密码包
    const masterKeyPack = await this.crypto.createCommonKeyPack(newHexCode, masterKey)
    // 更新主密码包
    return api.setMasterKeyInfo(masterKeyPack)
  }

  // master key section
  async loadMasterKey(){
    const masterKey = await this.getLocalData<string>(LocalCacheKeyMap.MASTER_KEY_CACHE_KEY)
    if(masterKey){
      this.setMasterKey(masterKey)
      console.log("本地缓存的主密码加载成功")
    }else{
      console.warn("读取主密码缓存失败")
    }
  }

  // 用户主密码导出原始主密码
  async loadMasterKeyWithKey(key:string){
    this.checkMasterKeyFormat(key)
    const hexCode = this.crypto.convertToHexString(key)
    if(!this.user.masterKeyPack?.keyPack) throw Error('未设置主密码')
    const masterKey = await this.crypto.fetchKeyFromKeyPack(this.user.masterKeyPack.keyPack, hexCode)
    this.setMasterKey(masterKey)
  }

  setMasterKey(key:string){
    this._masterKey = key
  }

  async clearMasterKey(){
    this.setMasterKey('')
    return this.deleteLocalData(LocalCacheKeyMap.MASTER_KEY_CACHE_KEY)
  }

  async cacheMasterKey(){
    if(!this.masterKey) return
    return this.setLocalData(LocalCacheKeyMap.MASTER_KEY_CACHE_KEY, this.masterKey)
  }

  // 使用前检测主密码状态
  checkMasterKey(){
    const error = {
      code: '',
      message: ''
    }
    if(!this.user.isSetMasterKey){
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
      this.crypto.verifyKeyId(this.masterKey, this.user.masterKeyPack?.keyId!)
    } catch (err) {
      error.code = '22'
      error.message = '主密码不匹配'
      throw error
    }

  }

  checkMasterKeyFormat(key:string){
    const clearKey = key.replace(/\s/g, '')
    if(!clearKey || clearKey.length < 6) throw Error("格式错误")
  }
  // master key section end

  async previewImage(pics: string[], idx?:number){
    getApp().globalData.state.inPreviewPic = true
    wx.previewImage({
      urls: pics,
      current: pics[idx || 0]
    })
  }

  async createShareItem({card, scope, expiredTime}:CreateShareOptions){
    scope = scope?.length ? scope : []
    expiredTime = expiredTime || 3600
    // sk 3 bytes share key
    let sk = await this.crypto.randomHexString(3)
    // dk 16 bytes data key
    let dk = await this.crypto.randomHexString(16)
    const shareCard: Partial<ICard> = {
      encrypted: card.encrypted,
      image: [],
      info: []
    }
    if(card.encrypted){
      for (const image of card.image!) {
        if(!image._url || !await file.checkAccess(image._url)) throw Error("分享生成错误")
        const imageData = {url:'',salt:'',hash: image.hash}
        const encrytedPic = await this.cardManager.encryptImageWithKey(dk, image._url!, card.info)
        imageData.url = await this.cardManager.uploadShare(encrytedPic.imagePath)
        imageData.salt = encrytedPic.imageSecretKey

        shareCard.image!.push(imageData)
      }
    }else{
      dk = ''
      shareCard.info = this.rebuildExtraFields(card.info!)
      for (const image of card.image!) {
        shareCard.image!.push({
          url: image.url,
          salt: '',
          hash: image.hash
        })
      }
    }
    const resp = await api.setShareItem({
      card: shareCard,
      scope,
      expiredTime,
      sk
    })
    return {
      sid: resp.shareId,
      sk,
      dk
    }
  }

  condenseExtraFields(extraFields: ICardExtraField[]):[string,string][]{
    return extraFields.map(e=>{
      if(!(e.key && e.name && e.value)) throw Error('附加数据格式错误')
      return [e.key == 'cu'?`cu-${e.name}`:e.key,e.value!]
    })
  }

  rebuildExtraFields(extraFields: Partial<ICardExtraField>[]){
    return extraFields.map(item=>{
      const [key,cuName] = item[0].split('-')
      let extraField = this.Config.extraFieldsKeys.find(e=>e.key===key)
      extraField = Object.assign({name: '未知', value: '无'},extraField)
      if(key === 'cu') extraField.name = cuName
      extraField.value = item[1]
      return extraField
    })
  }

  async chooseLocalImage(){
    if(this.platform === 'mac'){
      throw Error('该客户端不支持选择图片功能')
    }
    getApp().globalData.state.inChooseLocalImage = true
    return chooseLocalImage()
  }

  // open app doc
  openUserUsageProtocol(){
    return this.navToDoc(this.Config.doc.userUsageProtocol)
  }

  openUserPrivacyProtocol(){
    return this.navToDoc(this.Config.doc.userPrivacyProtocol)
  }

  openDataSaveSecurityNoticeDoc(){
    return this.navToDoc(this.Config.doc.dataSaveSecurityNotice)
  }

  openDataShareDoc(){
    return this.navToDoc(this.Config.doc.dataShareNotice)
  }

  openDataCheckDoc(){
    return this.navToDoc(this.Config.doc.dataCheckNotice)
  }
  // open app doc end

  async getHomeData(forceUpdate?:boolean){
    let homeData = await this.cache.getHomeData()
    if(forceUpdate || !homeData){
      homeData = await api.getHomeData()
      await this.cache.setHomeCacheData(homeData)
    }
    return homeData
  }

  async deleteHomeDataCache(){
    return this.cache.deleteHomeData()
  }

  async fetchNotice(forceFetch?:boolean){
    if(!forceFetch){
      const nowTime = new Date().getTime()
      if(nowTime - this.lastNoticeFetchTime < 60000){
        return
      }
    }
    const notice = await api.getNotice()
    this.lastNoticeFetchTime = new Date().getTime()
    return notice
  }

  //数据
  //清除缓存
  async clearCacheData(){
    await file.rmdir(APP_ROOT_DIR, true)
    await this.deleteLocalData(LocalCacheKeyMap.CARD_EXTRA_DATA_CACHE_KEY)
    await this.deleteLocalData(LocalCacheKeyMap.USER_INFO_CACHE_KEY)
    await this.deleteLocalData(LocalCacheKeyMap.MASTER_KEY_CACHE_KEY)
    await this.deleteLocalData(LocalCacheKeyMap.HOME_DATA_CACHE_KEY)
    return 
  }

  //数据备份
  exportCardData(){
    showChoose('温馨提示','由于小程序平台限制,导出数据功能需要前往卡兔web端操作。')
  }

  //主密码备份/重置
  _generateRecoveryKeyWords(){
    return bip39.generateMnemonic()
  }

  _generateRecoveryKey(){
    const words = this._generateRecoveryKeyWords()
    return bip39.mnemonicToEntropy(words)
  }

  async generateRecoveryKeyQrcodeContent(){
    const rk = this._generateRecoveryKey()
    const qrContent = {
      i: (await crypto.random(2)).toUpperCase(),
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
    keyPack.keyId = this.crypto.calculateKeyId(qrCodeData.rk)
    keyPack.pack = this.crypto.encryptString(this.masterKey, qrCodeData.rk)
    return api.setRecoveryKey(keyPack)
  }

  _extractMasterKeyFromRecoveryKeyPack(recoveryKey){
    if(!this.user.recoveryKeyPack) throw Error("没有设置备份主密码")
    const masterKey = this.crypto.decryptString(this.user.recoveryKeyPack.pack, recoveryKey)
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
    const newHexCode = this.crypto.convertToHexString(key)
    // 重新生成新的主密码包
    const masterKeyPack = await this.crypto.createCommonKeyPack(newHexCode, masterKey)
    // 更新主密码包
    return api.setMasterKeyInfo(masterKeyPack)
  }

  //主密码备份/重置 结束
  navToDoc(id){
    navigateTo(`/pages/qa/detail/index?id=${id}`)
  }

  async getLocalFilePath(fileName:string, dirType?:string){
    const dir = dirType === 'home' ? APP_ROOT_DIR : 
                dirType === 'down' ? APP_DOWN_DIR : 
                dirType === 'dec' ? APP_IMAGE_DIR : 
                APP_TEMP_DIR

    return file.getFilePath({
      dir,
      name: fileName
    })
  }

  async getHomeFilePath(fileName:string){
    return this.getLocalFilePath(fileName, 'home')
  }

  async getCloudFileTempUrl(url:string){
    // check cache
    if(this.cache.cloudFileTempUrls[url]){
      console.debug('使用缓存的 url')
      return this.cache.cloudFileTempUrls[url]
    }

    let tempUrl = ''
    try {
      const {fileList:[file]} = await wx.cloud.getTempFileURL({
        fileList: [url]
      })
      if(file.status !== 0){
        console.error('获取云文件临时URL错误:', file.errMsg);
      }else{
        tempUrl = file.tempFileURL
        this.cache.cloudFileTempUrls[url] = tempUrl
      }
    } catch (error:any) {
      console.error('获取云文件临时URL错误:', error.message);
    }
    if(!tempUrl) {
      tempUrl = DefaultLoadFailedImage
    }
    return tempUrl
  }

  async imageContentCheck({imagePath}){
    const hash = await this.cardManager.getHash(imagePath)
    const cloudFilePath = `tmp/image_${hash}`
    const url = await this.uploadFile(imagePath, cloudFilePath)
  
    for(let i=0;i<10;i++){
      const res = await api.imageContentSafetyCheck({hash, url})
      if(res.checkEnd) return res
      await sleep(3000)
    }
    throw new Error("内容检测超时，请稍后重试")
  }

  async textContentsafetyCheck(text){
    return api.textContentSafetyCheck({text})
  }

  async showActiveNotice(title?:string){
    await showChoose("温馨提示", title || "账户未激活，无法进行该操作。", {
      confirmText:'去激活',
    }).then(({confirm})=>{
      if(confirm) this.goToUserUserProfilePage()
    })
  }

  async deleteAccount(){
    await api.removeAccount()
    this.user.clearInfo()
    this.clearMasterKey()
  }

  async sendVerifyCode(data: {tel:string}){
    return api.sendVerifyCode(data)
  }

  // simple api proxy
  async getNotices(){
    return api.getNotices()
  }

  // 导航
  async reLaunch(path?:string){
    return wx.reLaunch({
      url: path || `/pages/${APP_ENTRY_PATH}`,
    })
  }

  async goToUserUserProfilePage(){
    return switchTab('/pages/profile/index',false)
  }

  async goToHomePage(){
    return switchTab('/pages/home/index',false)
  }
}

function getAppManager(){
  return AppManager.getInstance<AppManager>()
}

export {
  getAppManager
}