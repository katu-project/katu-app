import Controller from '@/class/controller'
import { showChoose, sleep, file, showNotice, hasWechatInstall, convert } from '@/utils/index'
import { getCardManager } from './card'
import { getUserManager } from './user'
import { getMiniKeyManager, getMasterKeyManager, getResetKeyManager } from './key'
import { CreateI18nBehavior } from '@/behaviors/i18n'

class AppManager extends Controller {
  AppInfo = wx.getAccountInfoSync()
  UseLanguage = ''

  constructor(){
    super()
  }

  async init(systemInfo){
    this.setBaseInfo(systemInfo)
    console.debug(systemInfo,this.AppInfo)
    this.setDefaultLanguage()
    this.loadGlobalEvents()
    this.loadModules()
    this.firstOpenTask()
    this.checkUpdate()
    if(this.isApp){
      const requestConfig = this.getRequestConfig('http')
      if(requestConfig?.token){
        console.debug('使用内置 Token')
        await this.cache.setLoginToken(requestConfig.token)
      }
    }
  }

  get deviceInfo(){
    return {
      platform: this.platform,
      brand: this.DeviceInfo.brand || 'unknown',
      model: this.DeviceInfo.model || 'unknown',
      system: this.DeviceInfo.system || 'unknown',
      language: this.DeviceInfo.language || 'unknown'
    }
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

  get userManager(){
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
      if(!token) {
        this.logout()
        return
      } 
    }

    try {
      await this.userManager.loadInfo()
    } catch (error:any) {
      // 服务端凭证失效，需要重新登录
      if(this.isApp && error.code === 401){
        this.logout()
      }
      throw error
    }
    if(this.userManager.isSetMasterKey && this.userManager.rememberPassword){
      console.log("用户启用记住密码，尝试加载主密码")
      this.masterKeyManager.load()
    }
  }

  logout(){
    this.cache.deleteLoginToken()
    this.deleteHomeDataCache()
    this.masterKeyManager.clear()
    this.userManager.clearInfo()
    this.publishLoginChangeEvent(false)
  }

  async login(token:string){
    if(!token) throw Error('登录错误，请使用其他方式登录或者联系客服')
    await this.cache.setLoginToken(token)
    await this.userManager.reloadInfo()
    this.publishLoginChangeEvent(true)
  }

  async loginWithCode(code:string){
    const token = await this.invokeApi('getTokenByCode', code)
    return this.login(token)
  }

  async loginWithVerifyCode(options:{type:string, value:string, code:string, verifyId:string, extra?:string}){
    const extra = {
      device: `${this.deviceInfo.platform}_${this.deviceInfo.brand}_${this.deviceInfo.model}`,
      language: this.deviceInfo.language
    }
    options.extra = convert.stringToBase64(JSON.stringify(extra))
    const { token } = await this.invokeApi('loginWithVerifyCode', options)
    if(!token) throw Error('登录错误，请使用其他方式登录或者联系客服')
    return this.login(token)
  }

  async loginWithMp(){
    await this.invokeApi('activeAccount')
    return this.login('todo_not_use_now')
  }

  async bindOtherLoginByCode(code:string){
    return this.invokeApi('bindOtherLogin', code)
  }

  async unbindOtherLogin(type:string){
    return this.invokeApi('unbindOtherLogin', type)
  }

  loadGlobalEvents(){
    this.subscribeMasterKeyCacheEvent(this.masterKeyManager.setCache)
    this.subscribeMasterKeyRemoveEvent(this.masterKeyManager.clear)
    
    wx.onAppHide(()=>{
      // 以下操作会触发 onAppHide 事件
      const OnAppHideAction = ['InPreviewPic','InSelectFile','InShare']
      const globalState = getApp().globalData.state
      if(globalState.length && OnAppHideAction.includes(globalState[0])){
        console.log('onAppHide:', globalState[0]);
        globalState.pop()
        return
      }

      if(this.userManager.rememberPassword){
        this.publishMasterKeyCacheEvent()
      }else{
        this.publishMasterKeyRemoveEvent()
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
      homeDataCacheTime: this.getConfig('homeDataCacheTime')
    })
    this.notice.init({
      noticeFetchIntervalTime: this.getConfig('noticeFetchTime')
    })
    this.crypto.init(this.cryptoConfig)
  }

  async setDefaultLanguage(){
    let useLanguage = await this.getLocalData<UseLanguageType>('USE_LANG')
    if(!useLanguage) {
      const LanguageMap = [
        {
          name: 'zh',
          values: ['zh_CN','zh_HK','zh_TW'],
          default: true
        },
        {
          name: 'en',
          values: ['en']
        }
      ]
      let checkUseLang = LanguageMap.find(e=>e.values.includes(this.systemLanguage))
      if(!checkUseLang){
        checkUseLang = LanguageMap.find(e=>e.default)
      }
      await this.setLocalData('USE_LANG', checkUseLang?.name)
      useLanguage = checkUseLang?.name as UseLanguageType
    }

    this.UseLanguage = useLanguage
  }

  async getUseLanguage(){
    return this.getLocalData<UseLanguageType>('USE_LANG')
  }

  async setUseLanguage(lang:UseLanguageType){
    this.UseLanguage = lang
    return this.setLocalData('USE_LANG', lang)
  }

  // 未使用
  async saveCurrentUserCode(userCode){
    if(!userCode) return
    return this.cache.setLocalData('LAST_LOGIN_UID', userCode)
  }

  async checkLikeCardNeedSync(){
    const homeDataCache = await this.cache.getHomeData()
    if(!homeDataCache || homeDataCache?.data?.cateList?.length === 0) return true
    if(this.likeListCacheTimeoutCheck(homeDataCache.cacheTime)){
      console.debug('首页数据缓存超时,进行数据同步检测')
    }else{
      console.debug('首页数据 likeList 缓存有效')
      return false 
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

  syncMiniKey(){
    return this.miniKeyManager.sync(this.masterKeyManager.masterKey)
  }

  enableSyncMiniKey({syncId}){
    return this.miniKeyManager.enableSync({
      kid: syncId,
      masterKey: this.masterKeyManager.masterKey
    })
  }

  createMiniKey({miniKey}){
    return this.miniKeyManager.createMiniKey({
      miniKey,
      masterKey: this.masterKeyManager.masterKey
    })
  }

  createResetKey(){
    return this.resetKeyManager.create(this.masterKeyManager.masterKey)
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

  async checkQuotaNotice(msg?:string){
    return new Promise((resolve)=>{
      if(this.userManager.quota >= 0){
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
    await this.userManager.deleteAccount()
    await this.cache.deleteUser()
    await this.clearCacheData()
    return this.masterKeyManager.clear()
  }
  //设置页结束

  createPage<TData extends WechatMiniprogram.Page.DataOption,TCustom extends WechatMiniprogram.Page.CustomOption>(obj:WechatMiniprogram.Page.Options<TData,TCustom>){
    if(obj.i18n){
      if(!obj.behaviors){
        obj.behaviors = []
      }
      obj.behaviors.push(
        CreateI18nBehavior(obj.i18n)
      )
    }
    return Page(obj)
  }
  
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

  async showActiveNotice(title?:string, confirmText?:string){
    await this.showConfirm(title || "未登录，无法进行该操作。", confirmText || '去登录')
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

  async sendLoginVerifyCode(options:{type:string,value:string}){
    return this.sendVerifyCode(options.type, options.value)
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
}

function getAppManager(){
  return AppManager.getInstance<AppManager>()
}

export {
  getAppManager
}