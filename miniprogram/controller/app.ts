import Controller from '@/class/controller'
import api from '@/api'
import { showChoose, chooseLocalImage, switchTab, sleep, file } from '@/utils/index'
import { getCardManager } from './card'
import { getUserManager } from './user'

class AppManager extends Controller {
  AppInfo = wx.getAccountInfoSync()
  DeviceInfo: Partial<WechatMiniprogram.SystemInfo> = {}
  _masterKey: string = ''

  constructor(){
    super()
  }

  async init(){
    this.loadBaseInfo()
    this.loadGlobalEvents()
    this.loadGlobalTask()
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

  get shareInfo(){
    return this.getConfig('shareInfo')
  }

  async loadUser(){
    await this.user.init()
    if(this.user.isSetMasterKey && this.user.config?.security.rememberPassword){
      console.log("启用记住密码: 加载主密码");
      this.loadMasterKey()
    }
  }

  loadBaseInfo(){
    wx.getSystemInfoAsync({
      success: info => {
        this.DeviceInfo = info
        console.debug(info)
      }
    })
  }

  loadGlobalEvents(){
    this.on('CacheMasterKey', this.cacheMasterKey)
    this.on('ClearMasterKey', this.clearMasterKey)
  }

  async loadGlobalTask(){
    const clearExtraDataCache = async ()=> {
      const cardIdxs = await api.getCardSummary('CardIdxs')
      const localExtraDataCache = await this.cache.getExtraData()
      const invalidIds = Object.keys(localExtraDataCache).filter(e=>!cardIdxs.includes(e))
      if(invalidIds.length){
        console.log(`删除无效附加数据本地缓存：${invalidIds.length} 条`)
        await this.cache.deleteCardExtraData(invalidIds)
      }
    }
    const clearCardImageCache = async ()=> {
      const lastCacheClearTime = await this.getLocalData<number>('CACHE_CLEAR_TIME')
      const nowTime = new Date().getTime()
      const gapTime = Math.floor((nowTime - (lastCacheClearTime||0))/1000)
      if(gapTime > this.getConfig('cacheClearGapTime')){
        const imageIds = await api.getCardSummary('ImageIds')
        this.cache.deleteCardFile(imageIds)
        this.setLocalData('CACHE_CLEAR_TIME', nowTime)
      }
    }
    setTimeout(clearExtraDataCache, 2000)
    setTimeout(clearCardImageCache, 3000)
  }

  async loadModules(){
    this.cache.init({
      userAvatarDir: await this.getUserAvatarDir(),
      homeDataCacheTime: this.getConfig(this.isDev?'devHomeDataCacheTime':'homeDataCacheTime')
    })
    this.notice.init({
      noticeFetchIntervalTime: this.getConfig('noticeFetchTime')
    })
    this.crypto.init(this.getConfig('crypto'))
  }
  // user section
  async setUserMasterKey(key: string){
    const hexCode = this.crypto.convertToHexString(key)
    const masterKeyPack = await this.crypto.createCommonKeyPack(hexCode)
    return api.setMasterKeyInfo(masterKeyPack)
  }

  async updateUserMasterKey({key, newKey}){
    const hexCode = this.crypto.convertToHexString(key, this.user.ccv)
    const newHexCode = this.crypto.convertToHexString(newKey, this.user.ccv)
    if(!this.user.masterKeyPack?.keyPack) throw Error('未设置主密码')
    // 获取主密码
    const masterKey = await this.crypto.fetchKeyFromKeyPack(this.user.masterKeyPack.keyPack, hexCode)
    // 重新生成新的主密码包, 更新时使用最新的ccv
    const masterKeyPack = await this.crypto.createCommonKeyPack(newHexCode, masterKey)
    // 更新主密码包
    return api.setMasterKeyInfo(masterKeyPack)
  }

  // master key section
  async loadMasterKey(){
    const masterKey = await this.cache.getMasterKey()
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
    const hexCode = this.crypto.convertToHexString(key, this.user.ccv)
    if(!this.user.masterKeyPack?.keyPack) throw Error('未设置主密码')
    const masterKey = await this.crypto.fetchKeyFromKeyPack(this.user.masterKeyPack.keyPack, hexCode)
    this.setMasterKey(masterKey)
  }

  setMasterKey(key:string){
    this._masterKey = key
  }

  async clearMasterKey(){
    this.setMasterKey('')
    return this.cache.deleteMasterKey()
  }

  async cacheMasterKey(){
    if(!this.masterKey) return
    return this.cache.setMasterKey(this.masterKey)
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
      this.crypto.verifyKeyId(this.masterKey, this.user.masterKeyPack!, this.user.ccv)
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
      for (const pic of card.image!) {
        if(!pic._url || !await file.checkAccess(pic._url)) throw Error("分享生成错误")
        const image = {url: pic._url, salt: '', hash: pic.hash}
        const encrytedPic = await this.cardManager.encryptImage(image, card.info, dk)
        image.url = await this.uploadShareFile(encrytedPic.imagePath)
        image.salt = encrytedPic.imageSecretKey
        shareCard.image!.push(image)
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
      let extraField = this.getConfig('extraFieldsKeys').find(e=>e.key===key)
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
    const chooseTempFile = await chooseLocalImage()
    let userTempFile = ''
    if(chooseTempFile){
      userTempFile = await this.getTempFilePath('chooseLocalImage')
      await file.saveTempFile(chooseTempFile, userTempFile)
    }
    return userTempFile
  }

  async getHomeData({forceUpdate, getCateList}:{forceUpdate?:boolean, getCateList?:boolean}):Promise<IHomeData>{
    let homeData:IHomeData|undefined

    if(getCateList){
      homeData = {
        likeList: [],
        cateList: await api.getCardSummary('CateList')
      }
      return homeData
    }

    if(!forceUpdate){
      homeData = await this.cache.getHomeData()
    }

    if(!homeData){
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
      const needFetchNotice = this.notice.checkNeedFetchNotice()
      if(!needFetchNotice){
        return
      }
    }
    const notice = await api.getNotice()
    this.notice.resetNoticeFetchTime()
    return notice
  }

  //数据
  //清除缓存
  async clearCacheData(){
    await file.rmdir(this.getConst('APP_ROOT_DIR'), true)
    await this.cache.clearAll()
    return 
  }

  //数据备份
  exportCardData(){
    showChoose('温馨提示','由于小程序平台限制,导出数据功能需要前往卡兔web端操作。')
  }

  //主密码备份/重置
  async generateRecoveryKey(){
    return this.crypto.createRecoveryKey(this.masterKey, this.user.ccv)
  }

  setRecoveryKey(keyPack){
    return api.setRecoveryKey(keyPack)
  }

  async extractQrPackFromQrcode(qrcode){
    try {
      const qrPack = JSON.parse(qrcode.result)
      return qrPack
    } catch (error) {
      throw Error("无法识别该凭证!")
    }
  }

  async resetMasterKeyWithRecoveryKey({rk, newKey}){
    this.checkMasterKeyFormat(newKey)
    if(!this.user.recoveryKeyPack) throw Error("没有设置备份主密码")
    const masterKey = this.crypto.extractKeyFromRecoveryKeyPack(this.user.recoveryKeyPack, rk)
    const newHexCode = this.crypto.convertToHexString(newKey, this.user.ccv)
    // 重新生成新的主密码包
    const masterKeyPack = await this.crypto.createCommonKeyPack(newHexCode, masterKey)
    // 更新主密码包
    return api.setMasterKeyInfo(masterKeyPack)
  }

  //主密码备份/重置 结束

  async imageContentCheck({imagePath}){
    const hash = await this.getImageHash(imagePath, 'SHA1')
    const url = await this.uploadTempFile(imagePath)
    for(let i=0;i<10;i++){
      const res = await api.imageContentSafetyCheck({hash, url})
      if(res.checkEnd) return res
      await sleep(3000)
    }
    throw new Error("内容检测超时，请稍后重试")
  }

  async textContentSafetyCheck(text){
    const { checkPass } = await api.textContentSafetyCheck({text})
    if(!checkPass) throw Error('数据存在不适内容')
  }

  async getActiveInfo(){
    const activeInfo = await api.getSysConfig('active')
    const { content } = await api.getDoc({_id: activeInfo.id})
    return {
      activeInfo,
      content
    }
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

  async getHotDoc(){
    return api.getHotDoc()
  }

  async getChangeLog(){
    return api.getChangeLog()
  }

  async getDoc(params){
    return api.getDoc(params)
  }

  async getCateDoc(params){
    return api.getCateDoc(params)
  }

  async getShareItem(params){
    return api.getShareItem(params)
  }

  // 导航
  async reLaunch(path?:string){
    return wx.reLaunch({
      url: path || `/pages/${this.getConst('APP_ENTRY_PATH')}`,
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