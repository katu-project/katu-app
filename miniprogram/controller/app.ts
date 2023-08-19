import Controller from '@/class/controller'
import api from '@/api'
import { showChoose, setClipboardData, sleep, file, getPrivacySetting } from '@/utils/index'
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
    if(this.user.isSetMasterKey && this.user.rememberPassword){
      console.log("用户启用记住密码，尝试加载主密码")
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
    const clearTempFileCache = async ()=> {
      console.debug(`开始清理临时文件目录`)
      await this.cache.clearTempDirFile()
    }
    const clearExtraDataCache = async ()=> {
      console.debug('开始检测是否有无效的卡片附加数据')
      try {
        const cardIdxs = await api.getCardSummary('CardIdxs')
        const localExtraDataCache = await this.cache.getExtraDatas()
        const invalidIds = Object.keys(localExtraDataCache).filter(e=>!cardIdxs.includes(e))
        if(invalidIds.length){
          console.debug(`删除无效附加数据本地缓存：${invalidIds.length} 条`)
          await this.cache.deleteCardExtraData(invalidIds)
        }
      } catch (error) {
        console.error('clearExtraDataCache:',error)
      }
    }
    const clearCardImageCache = async ()=> {
      console.debug('开始检测是否有无效图片缓存数据')
      try {
        await this.checkCacheClearTimeout()
      } catch (_) {
        try {
          const imageIds = await api.getCardSummary('ImageIds')
          console.debug(`删除无效图片缓存数据：${imageIds.length} 条`)
          this.cache.deleteCardFile(imageIds)
        } catch (error) {
          console.error('clearCardImageCache:',error)
        }
      }
    }
    setTimeout(clearExtraDataCache, 2000)
    setTimeout(clearCardImageCache, 3000)
    setTimeout(clearTempFileCache, 1000)
  }

  async loadModules(){
    this.cache.init({
      userAvatarDir: await this.getUserAvatarDir(),
      homeDataCacheTime: this.getConfig(this.isDev?'devHomeDataCacheTime':'homeDataCacheTime')
    })
    this.notice.init({
      noticeFetchIntervalTime: this.getConfig('noticeFetchTime')
    })
    this.crypto.init(this.cryptoConfig)
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
      console.warn("未发现本地缓存的主密码")
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

    if(!this.user.rememberPassword && !this.masterKey){
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
      shareCard.info = this.cardManager.rebuildExtraFields(card.info!)
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

  async chooseLocalImage(){
    if(this.platform === 'mac'){
      throw Error('该客户端不支持选择图片功能')
    }
    getApp().globalData.state.inChooseLocalImage = true
    return super.chooseLocalImage()
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
    const notice = await api.getHotNotice()
    this.notice.resetNoticeFetchTime()
    return notice
  }

  async knowContentCheck(){
    const isKnowDataCheck = await this.notice.getKnowDataCheck()
    if(isKnowDataCheck) return

    const {cancel, confirm} = await this.showChoose('将进行图片内容合规检测\n此过程可能需要等待5-10秒',{
      cancelText: '了解详情',
      confirmText: '不再提示'
    })
    if(cancel){
      this.openDataCheckDoc()
      return new Promise(()=>{})
    }
    if(confirm){
      this.notice.setKnowDataCheck()
    }
    return
  }

  async knowDataShare(){
    const isKnow = await this.notice.getKnowShareData()
    if(isKnow) return
    
    const {cancel, confirm} = await this.showChoose('更多分享帮助点击【了解详情】',{
      cancelText: '了解详情',
      confirmText: '不再提示'
    })
    if(cancel){
      this.openDataShareDoc()
      return new Promise(()=>{})
    }
    if(confirm){
      this.notice.setKnowShareData()
    }
    return
  }

  async knowDataEncrypt(){
    const isKnow = await this.notice.getKnowEncryptSave()
    if(isKnow) return
    
    const {cancel, confirm} = await this.showChoose('非加密保存有数据泄漏风险！',{
      cancelText: '了解详情',
      confirmText: '不再提示'
    })
    if(cancel){
      this.openDataSaveSecurityNoticeDoc()
      return new Promise(()=>{})
    }
    if(confirm){
      this.notice.setKnowEncryptSave()
    }
    return
  }

  async checkQuotaNotice(msg?:string){
    return new Promise((resolve)=>{
      if(this.user.quota > 0){
        return resolve("")
      }
      this.showNotice(msg || '无可用兔币，无法查看卡片')
    })
  }

  async checkUserPrivacy(){
    try {
      return await getPrivacySetting()
    } catch (_) {}
    return
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
    this.showNotice('由于平台限制\n导出数据需前往卡兔web端操作。')
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

  async deleteAccount(){
    await this.user.deleteAccount()
    await this.clearCacheData()
    return this.clearMasterKey()
  }
  //设置页结束

  async imageContentCheck({imagePath}){
    const hash = await this.getImageHash(imagePath, this.getConfig('contentCheckHash'))
    const { needCheck, checkPass } = await api.getContentCheckInfo({hash})
    if(needCheck){
      const url = await this.uploadTempFile(imagePath)
      for(let i=0;i<10;i++){
        if(i==9) throw Error("内容检测超时，请稍后重试")
        const { checkEnd, checkPass } = await api.imageContentSafetyCheck({hash, url})
        if(checkEnd){
          if(checkPass){
            return
          }else{
            break
          }
        } 
        await sleep(3000)
      }
    }else{
      if(checkPass) return
    }
    throw Error('图片存在不适内容')
  }

  async textContentSafetyCheck(text){
    const hash = this.crypto.getStringHash(text, this.getConfig('contentCheckHash'))
    const { needCheck, checkPass } = await api.getContentCheckInfo({hash})
    
    if(needCheck){
      const { checkPass } = await api.textContentSafetyCheck({text})
      if(checkPass) return
    }else{
      if(checkPass) return
    }
    throw Error('文字存在不适内容')
  }

  async getActiveInfo(){
    const activeInfo = await api.getSysConfig('active')
    const { content } = await api.getDoc({_id: activeInfo.id})
    return {
      activeInfo,
      content
    }
  }

  async showActiveNotice(goActivePage:boolean, title?:string){
    await this.showConfirm(title || "账户未激活，无法进行该操作。",'现在激活')
    if(!goActivePage) return
    getApp().globalData.showActive = true
    return this.goToUserProfilePage()
  }
  
  async showSetMasterKeyNotice(){
    await this.showConfirm("未设置主密码",'去设置')
    return this.goEditMasterKeyPage()
  }

  // simple api proxy
  async createDevToken(){
    return api.getDevToken()
  }

  async sendVerifyCode(data: {tel:string}){
    return api.sendVerifyCode(data)
  }

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

  // 弹窗提示
  showNotice(msg:string, options?:any){
    return showChoose('温馨提示',msg, { showCancel: false, ...options})
  }

  async showConfirm(msg:string, confirmText?:string){
    const options = {}
    if(confirmText) options['confirmText'] = confirmText
    const { confirm } = await showChoose('温馨提示',msg, options)
    return new Promise((resolve,_)=>confirm && resolve(confirm))
  }

  async showChoose(msg:string, options?:WechatMiniprogram.ShowModalOption){
    return showChoose('温馨提示', msg, options)
  }

  // 系统API
  setClipboardData(data){
    return setClipboardData(data)
  }
}

function getAppManager(){
  return AppManager.getInstance<AppManager>()
}

export {
  getAppManager
}