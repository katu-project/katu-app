import Controller from '@/class/controller'
import { showChoose, setClipboardData, sleep, file, getPrivacySetting, showNotice } from '@/utils/index'
import { getCardManager } from './card'
import { getUserManager } from './user'
import { getMiniKeyManager, getMasterKeyManager, getResetKeyManager } from './key'

class AppManager extends Controller {
  AppInfo = wx.getAccountInfoSync()
  DeviceInfo: Partial<WechatMiniprogram.SystemInfo> = {}

  isApp = false
  isMp = true

  constructor(){
    super()
    // #if NATIVE
    this.isMp = false
    this.isApp = true
    // #elif MP
    this.isMp = true
    this.isApp = false
    // #endif
  }

  async init(systemInfo){
    this.setBaseInfo(systemInfo)
    this.loadGlobalEvents()
    this.loadModules()
    this.checkUpdate()
    return
  }

  get version(){
    let version = this.AppInfo.miniProgram.version
    if(this.isApp){
      version = this.DeviceInfo.host?.['appVersion']
    }
    return version || 'develop'
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

  get masterKeyManager(){
    return getMasterKeyManager()
  }
  
  get miniKeyManager(){
    return getMiniKeyManager()
  }

  get resetKeyManager(){
    return getResetKeyManager()
  }

  get shareInfo(){
    return this.getConfig('shareInfo')
  }

  checkUpdate(){
    console.log('检查更新')
    if(this.isMp){
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckForUpdate(({hasUpdate})=>{
        console.log({hasUpdate})
        if(!hasUpdate) return
        updateManager.onUpdateReady(async ()=>{
          await this.showConfirm('发现新版本，现在更新？')
          updateManager.applyUpdate()
        })
      })
    }else{
      // todo update check on other platform
    }
  }

  async loadUser(_:any){
    if(this.isApp){
      const token = await this.getLocalData('KATU_APP_TOKEN')
      if(!token) return
    }
    await this.user.init()
    if(this.user.isSetMasterKey && this.user.rememberPassword){
      console.log("用户启用记住密码，尝试加载主密码")
      this.masterKeyManager.load()
    }
  }

  async loadUserByCode(code:string){
    const token = await this.api.getTokenByCode(code)
    if(!token) return
    await this.setLocalData('KATU_APP_TOKEN', token)
    await this.user.init()
    if(this.user.isSetMasterKey && this.user.rememberPassword){
      console.log("用户启用记住密码，尝试加载主密码")
      this.masterKeyManager.load()
    }
  }

  setBaseInfo(systemInfo){
    this.DeviceInfo = systemInfo
    console.debug(systemInfo,this.AppInfo)
  }

  loadGlobalEvents(){
    this.on('CacheMasterKey', this.masterKeyManager.setCache)
    this.on('ClearMasterKey', this.masterKeyManager.clear)
  }

  async loadGlobalTask(){
    const clearTempFileCache = async ()=> {
      console.debug(`开始清理临时文件目录`)
      await this.cache.clearTempDirFile()
    }
    const clearExtraDataCache = async ()=> {
      console.debug('开始检测是否有无效的卡片附加数据')
      try {
        const cardIdxs = await this.api.getCardSummary('CardIdxs')
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
          const imageIds = await this.api.getCardSummary('ImageIds')
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

  async checkLastLogin(){
    const currentUid = this.user.uid
    if(!currentUid) return
    const lastLoginUser = await this.cache.getLocalData<string>('LAST_LOGIN_UID')
    if(!lastLoginUser){
      await this.cache.setLocalData('LAST_LOGIN_UID', currentUid)
      return
    }
    if(lastLoginUser !== currentUid){
      await this.cache.setLocalData('LAST_LOGIN_UID', currentUid)
      console.debug('清除上次登录用户缓存数据')
      await this.cache.deleteHomeData()
    }
  }

  async checkNeverLogin(){
    const loginUserId = await this.cache.getLocalData<string>('LAST_LOGIN_UID')
    return !loginUserId
  }

  openCustomerService(){
    // 二次跳转
    wx.miniapp.launchMiniProgram({
      userName: 'gh_be19db4e969f',
      path: 'pages/about/contact/index?openService=1',
      miniprogramType: 0,
      success: console.log,
      fail: console.log
    })
    
    // 微信客服服务，需要开放平台认证
    // return wx.miniapp.openCustomerServiceChat({
    //   corpId: 'ww33f3ccab4cbd777c',
    //   url: 'https://work.weixin.qq.com/kfid/kfc1cb144db771291df',
    //   success: console.log,
    //   fail: console.log,
    //   complete: console.log
    // })
  }

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
    const resp = await this.api.setShareItem({
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
        cateList: await this.api.getCardSummary('CateList')
      }
      return homeData
    }

    if(!forceUpdate){
      homeData = await this.cache.getHomeData()
    }

    if(!homeData){
      homeData = await this.api.getHomeData()
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
    const notice = await this.api.getHotNotice()
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

  async getUserPrivacyNotice(_:any){
    return this.api.getUserPrivacyInfo()
  }

  //数据
  //清除缓存
  async clearCacheData(){
    await file.rmdir(this.getConst('APP_ROOT_DIR'), true)
    await this.cache.clearAll()
    return 
  }

  //数据备份
  async exportCardData(){
    return this.api.exportData({type: 'card'})
  }

  async deleteAccount(){
    await this.user.deleteAccount()
    await this.clearCacheData()
    return this.masterKeyManager.clear()
  }
  //设置页结束

  async imageContentCheck({imagePath}){
    const hash = await this.getImageHash(imagePath, this.getConfig('contentCheckHash'))
    const { needCheck, checkPass } = await this.api.getContentCheckInfo({hash})
    if(needCheck){
      const url = await this.uploadTempFile(imagePath)
      for(let i=0;i<10;i++){
        if(i==9) throw Error("内容检测超时，请稍后重试")
        const { checkEnd, checkPass } = await this.api.imageContentSafetyCheck({hash, url})
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
    const { needCheck, checkPass } = await this.api.getContentCheckInfo({hash})
    
    if(needCheck){
      const { checkPass } = await this.api.textContentSafetyCheck({text})
      if(checkPass) return
    }else{
      if(checkPass) return
    }
    throw Error('文字存在不适内容')
  }

  async getActiveInfo(){
    const activeInfo = await this.api.getSysConfig('active')
    const { content } = await this.api.getDoc({_id: activeInfo.id})
    return {
      activeInfo,
      content
    }
  }

  async showActiveNotice(goActivePage:boolean, title?:string){
    await this.showConfirm(title || "账户未激活，无法进行该操作。",'现在激活')
    if(!goActivePage) return
    return this.goToUserProfilePage()
  }
  
  async showSetMasterKeyNotice(){
    await this.showConfirm("未设置主密码",'去设置')
    return this.goEditMasterKeyPage()
  }

  // simple api proxy
  async createApiToken(){
    return this.api.getApiToken()
  }

  async sendVerifyCode(data: {tel:string}){
    return this.api.sendVerifyCode(data)
  }

  async getNotices(_:any){
    return this.api.getNotices()
  }

  async getHotDoc(){
    return this.api.getHotDoc()
  }

  async getChangeLog(){
    return this.api.getChangeLog()
  }

  async getDoc(params){
    return this.api.getDoc(params)
  }

  async getCateDoc(params){
    return this.api.getCateDoc(params)
  }

  async getShareItem(params){
    return this.api.getShareItem(params)
  }

  // 弹窗提示

  showMiniNotice(msg){
    return showNotice(msg)
  }

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