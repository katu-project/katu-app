import Controller from '@/class/controller'
import { showChoose, setClipboardData, sleep, file, showNotice, hasWechatInstall } from '@/utils/index'
import { getCardManager } from './card'
import { getUserManager } from './user'
import { getMiniKeyManager, getMasterKeyManager, getResetKeyManager } from './key'

class AppManager extends Controller {
  AppInfo = wx.getAccountInfoSync()
  DeviceInfo: Partial<WechatMiniprogram.SystemInfo> = {}

  isApp = false
  isAndroid = false
  isIos = false
  isMp = true

  constructor(){
    super()
    // #if ANDROID
    this.isMp = false
    this.isAndroid = true
    this.isIos = false
    this.isApp = true
    // #elif IOS
    this.isMp = false
    this.isAndroid = false
    this.isIos = true
    this.isApp = true
    // #elif MP
    this.isMp = true
    this.isAndroid = false
    this.isIos = false
    this.isApp = false
    // #endif
  }

  async init(systemInfo){
    this.setBaseInfo(systemInfo)
    this.loadGlobalEvents()
    this.loadModules()
    this.firstOpenTask()
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

  get observers(){
    return {
      IapTransactionObserver: {
        updatedTransactions: (args:updatedTransactionsRes) => {
          if(!args.transactions.length) return
          const transaction = args.transactions[0]
          console.debug('支付状态变动:', transaction.payment.applicationUsername, transaction.transactionIdentifier || transaction.tempTransactionIdentifier, transaction.transactionState)
          switch (transaction.transactionState) {
            case 'SKPaymentTransactionStatePurchased':
              this.publishAppleOrderPayDoneEvent(transaction)
              break;
            case 'SKPaymentTransactionStateFailed':
              this.publishAppleOrderPayCancelEvent()
              break
            default:
              break;
          }
        }
      }
    }
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

  firstOpenTask(){
    if(this.isApp){
      // iOS app 首次安装后第一个网络请求会失败,所以先发送一个测试请求
      this.invokeApi('appStatus').catch(e=>{
        console.error('app hook req:',e)
      })
    }
  }

  async loadUser(){
    if(this.isApp){
      const token = await this.cache.getLoginToken()
      if(!token) return 
    }

    try {
      await this.user.loadInfo()
    } catch (error:any) {
      if(this.isApp && error.code === 401){
        this.logout()
      }
      throw error
    }
    if(this.user.isSetMasterKey && this.user.rememberPassword){
      console.log("用户启用记住密码，尝试加载主密码")
      this.masterKeyManager.load()
    }
  }

  async loginWithCode(code:string){
    const token = await this.invokeApi('getTokenByCode', code)
    if(!token) throw Error('登录错误，请使用其他方式登录或者联系客服')
    await this.cache.setLoginToken(token)
    await this.user.reloadInfo()
    this.publishLoginChangeEvent(true)
  }

  async loginWithEmail(options:{email:string, code:string, verifyId:string}){
    const { token } = await this.invokeApi('activeAccountWithEmail', options)
    if(!token) throw Error('登录错误，请使用其他方式登录或者联系客服')
    await this.cache.setLoginToken(token)
    await this.user.reloadInfo()
    this.publishLoginChangeEvent(true)
  }

  async loginWithMp(){
    await this.invokeApi('activeAccount')
    await this.user.reloadInfo()
    this.publishLoginChangeEvent(true)
  }

  async bindOtherLoginByCode(code:string){
    return this.invokeApi('bindOtherLogin', code)
  }

  async unbindOtherLogin(type:string){
    return this.invokeApi('unbindOtherLogin', type)
  }

  setBaseInfo(systemInfo){
    this.DeviceInfo = systemInfo
    console.debug(systemInfo,this.AppInfo)
  }

  loadGlobalEvents(){
    this.subscribeMasterKeyCacheEvent(this.masterKeyManager.setCache)
    this.subscribeMasterKeyRemoveEvent(this.masterKeyManager.clear)
    
    wx.onAppHide(res=>{
      const globalState = getApp().globalData.state
      console.log('onAppHide:', res, globalState);
      // 暂时解决图片预览引起的清除主密码的bug
      if(globalState.inPreviewPic){
        globalState.inPreviewPic = false
        return
      }else if(globalState.inChooseLocalImage){
        globalState.inChooseLocalImage = false
        return
      }else if(globalState.inShareData){
        globalState.inShareData = false
        return
      }

      if(this.user.rememberPassword){
        console.log('缓存主密码');
        this.publishMasterKeyCacheEvent()
      }else{
        if(this.user.config?.security.lockOnExit){
          console.log('退出并清除主密码');
          this.publishMasterKeyRemoveEvent()
        }
      }
    })
  }

  async loadGlobalTask(){
    const clearTempFileCache = async ()=> {
      if(await this.globalTaskTimeoutCheck()){
        console.debug(`开始清理临时文件目录`)
        await this.cache.clearTempDirFile()
      }
    }
    const clearExtraDataCache = async ()=> {
      if(await this.globalTaskTimeoutCheck()){
        console.debug('开始检测卡片无效附加数据')
        try {
          const cardIds = await this.getCardIds()
          const localExtraDataCache = await this.cache.getExtraDatas()
          const invalidIds = Object.keys(localExtraDataCache).filter(e=>!cardIds.includes(e))
          if(invalidIds.length){
            console.debug(`删除无效附加数据本地缓存：${invalidIds.length} 条`)
            await this.cache.deleteCardExtraData(invalidIds)
          }
        } catch (error) {
          console.error('clearExtraDataCache:',error)
        }
      }
    }
    const clearCardImageCache = async ()=> {
      if(await this.globalTaskTimeoutCheck()){
        console.debug('开始检测图片无效缓存数据')
        try {
          const imageIds = await this.getImageIds()
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

  // 未使用
  async saveCurrentUserCode(userCode){
    if(!userCode) return
    return this.cache.setLocalData('LAST_LOGIN_UID', userCode)
  }

  async checkLikeCardNeedSync(){
    const homeDataCache = await this.cache.getHomeData()
    if(!homeDataCache || homeDataCache?.data?.cateList?.length === 0) return true
    try {
      this.checkTimeout(homeDataCache.cacheTime, this.getConfig('homeDataCacheTime'))
      console.debug('首页数据 likeList 缓存有效')
      return false
    } catch (error) {
      console.debug('首页数据缓存超时,进行数据同步检测')
    }
    const likeList = homeDataCache.data.likeList
    const remoteLikeList = await this.getLikeCardIds()
    console.debug('checkLikeCardNeedSync', likeList.length, remoteLikeList.length)
    // todo: 现在只对数量检查，需要考虑数量相同id不同的情况
    if(remoteLikeList.length && remoteLikeList.length !== likeList.length) return true
    // 如果数据没变化，只是时间超时，就更新缓存的时间
    this.cache.setHomeCacheData(homeDataCache.data)
    return false
  }

  // 未使用
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

  async hasInstallWechat(){
    if(this.isMp) return true
    if(!this.isApp) return false
    try {
      return await hasWechatInstall()
    } catch (error) {
      return false
    }
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
    let sk = await this.crypto.randomHex(6)
    // dk 16 bytes data key
    let dk = await this.crypto.randomHex(32)
    const shareCard: Partial<ICard> = {
      encrypted: card.encrypted,
      image: [],
      info: []
    }
    if(card.encrypted){
      for (const pic of card.image!) {
        if(!pic._url || !await file.checkAccess(pic._url)) throw Error("分享生成错误")
        const image = {url: pic._url, salt: '', hash: pic.hash, ccv:''}
        const encrytedPic = await this.cardManager.encryptImage(image, card.info, dk)
        image.url = await this.uploadShareFile(encrytedPic.path)
        image.salt = encrytedPic.keySalt
        image.ccv = encrytedPic.ccv
        shareCard.image!.push(image)
      }
    }else{
      dk = ''
      shareCard.info = this.cardManager.rebuildExtraFields(card.info!)
      for (const image of card.image!) {
        shareCard.image!.push({
          url: image.url,
          salt: '',
          hash: image.hash,
          ccv: ''
        })
      }
    }
    const resp = await this.invokeApi('setShareItem', {
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

  async getHomeData({skipCache, cacheOnly}:{skipCache?:boolean, cacheOnly?:boolean}):Promise<IHomeData>{
    if(!skipCache){
      const homeDataCache = await this.cache.getHomeData()
      const homeData = homeDataCache?.data
      if(cacheOnly) {
        return homeData || {
          likeList: [],
          cateList: []
        }
      }
      if(homeData) return homeData
    }

    const homeData = await this.invokeApi('getHomeData')
    await this.cache.setHomeCacheData(homeData)
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
    const notice = await this.invokeApi('getHotNotice')
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

  async getIapItems(){
    const iapItems:{key:string,label:string}[] = []
    try {
      const items = await this.invokeApi('getIapItems')
      items.map(e=>iapItems.push(e))
    } catch (error) {
      console.error('getIapItems:',error)
      iapItems.push({
        key: 'katu_coin_1000',
        label: '购买 1000 个兔币'
      })
    }
    return iapItems
  }

  async clearUserTagsCache(){
    await this.cache.deleteTags()
    this.publishTagChangeEvent()
  }

  //设置页开始
  logout(){
    this.cache.deleteLoginToken()
    this.deleteHomeDataCache()
    this.masterKeyManager.clear()
    this.user.clearInfo()
    this.publishLoginChangeEvent(false)
  }

  //数据
  //清除缓存
  async clearCacheData(){
    try {
      await file.rmdir(this.getConst('APP_TEMP_DIR'))
      await file.rmdir(this.getConst('APP_DOWN_DIR'))
      await file.rmdir(this.getConst('APP_IMAGE_DIR'))
    } catch (error) {
      console.warn('clearCacheData', error)
    }
    await this.cache.deleteAllCard()
    await this.cache.deleteHomeData()
    this.publishCacheDeleteEvent()
  }

  //数据备份
  async exportCardData(){
    return this.invokeApi('exportData', {type: 'card'})
  }

  async deleteAccount(){
    await this.user.deleteAccount()
    await this.clearCacheData()
    return this.masterKeyManager.clear()
  }
  //设置页结束

  async imageContentCheck({imagePath}){
    const hash = await this.getImageHash(imagePath, this.getConfig('contentCheckHash'))
    const { needCheck, checkPass } = await this.invokeApi('getContentCheckInfo', {hash})
    if(needCheck){
      const url = await this.uploadTempFile(imagePath)
      for(let i=0;i<10;i++){
        if(i==9) throw Error("内容检测超时，请稍后重试")
        const { checkEnd, checkPass } = await this.invokeApi('imageContentSafetyCheck', {hash, url})
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
    const { needCheck, checkPass } = await this.invokeApi('getContentCheckInfo', {hash})
    
    if(needCheck){
      const { checkPass } = await this.invokeApi('textContentSafetyCheck', {text})
      if(checkPass) return
    }else{
      if(checkPass) return
    }
    throw Error('文字存在不适内容')
  }

  async getActiveInfo(){
    const activeInfo = await this.invokeApi('getSysConfig', 'active')
    const { content } = await this.invokeApi('getDoc', {_id: activeInfo.id})
    return {
      activeInfo,
      content
    }
  }

  async showActiveNotice(goActivePage:boolean, title?:string){
    await this.showConfirm(title || "未登录，无法进行该操作。",'去登录')
    if(!goActivePage) return
    return this.goToUserProfilePage()
  }
  
  async showSetMasterKeyNotice(){
    await this.showConfirm("未设置主密码",'去设置')
    return this.goEditMasterKeyPage()
  }

  // simple api proxy
  async createApiToken(){
    return this.invokeApi('getApiToken')
  }

  async sendSmsVerifyCode(tel:string){
    return this.sendVerifyCode('sms', tel)
  }

  async sendEmailVerifyCode(email:string){
    return this.sendVerifyCode('email', email)
  }

  async getNotices(_:any){
    return this.invokeApi('getNotices')
  }

  async getHotDoc(){
    return this.invokeApi('getHotDoc')
  }

  async getChangeLog(){
    return this.invokeApi('getChangeLog')
  }

  async getDoc(params){
    return this.invokeApi('getDoc', params)
  }

  async getCateDoc(params){
    return this.invokeApi('getCateDoc', params)
  }

  async getShareItem(params){
    return this.invokeApi('getShareItem', params)
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