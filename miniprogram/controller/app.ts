import Controller from '@/class/controller'
import { showChoose, sleep, file, showNotice, hasWechatInstall, convert } from '@/utils/index'
import { getCardManager } from './card'
import { getUserManager } from './user'
import { getMiniKeyManager, getMasterKeyManager, getResetKeyManager } from './key'
import { CreateI18nBehavior } from '@/behaviors/i18n'

class AppManager extends Controller {
  AppInfo = wx.getAccountInfoSync()
  
  constructor(){
    super()
  }

  initI18n(sysLanguage:string){
    const setDefaultLanguage = ()=>{
      let useLanguage = this.getLocalDataSync<UseLanguageType>('USE_LANG')
      if(!useLanguage) {
        const enabledLanguages = this.theme.Languages
        let checkUseLang = enabledLanguages.find(e=>e.values.includes(sysLanguage))
        if(!checkUseLang){
          checkUseLang = enabledLanguages.find(e=>e.default)
        }
        this.setLocalData('USE_LANG', checkUseLang?.name)
        useLanguage = checkUseLang?.name as UseLanguageType
      }
      this.UseLanguage = useLanguage
    }
    setDefaultLanguage()
    
    this.i18n.changeLanguage(this.UseLanguage)
  }

  async init(systemInfo){
    this.setBaseInfo(systemInfo)
    console.debug(systemInfo,this.AppInfo)
    this.loadGlobalEvents()
    this.loadModules()
    this.firstOpenTask()
    this.checkUpdate()
    if(this.isApp){
      const requestConfig = this.getRequestConfig('http')
      if(requestConfig?.token){
        console.debug('Use build-in Token')
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
          console.debug('pay stats change:', transaction.payment.applicationUsername, transaction.transactionIdentifier || transaction.tempTransactionIdentifier, transaction.transactionState)
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
    console.log('check update')
    if(this.isMp){
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckForUpdate(({hasUpdate})=>{
        console.log({hasUpdate})
        if(!hasUpdate) return
        updateManager.onUpdateReady(async ()=>{
          await this.showConfirm(this.t('new_version_tips'))
          updateManager.applyUpdate()
        })
      })
    }else{
      // todo update check on other platform
    }
  }

  firstOpenTask(){
    if(this.isApp){
      // iOS app first network request will fail after the first installation, so send a test request first
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
      // The server token are invalid and need to log in again
      if(this.isApp && error.code === 401){
        this.logout()
      }
      throw error
    }
    if(this.userManager.isSetMasterKey && this.userManager.rememberPassword){
      console.log("User enable remember key, try to load the master key")
      this.masterKeyManager.load()
    }
  }

  logout(){
    this.cache.deleteLoginToken()
    this.deleteHomeDataCache()
    this.clearUserTagsCache()
    this.masterKeyManager.clear()
    this.userManager.clearInfo()
    this.publishLoginChangeEvent(false)
  }

  async login(token:string){
    if(!token) throw Error(this.t_e('login_error'))
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
      // The following actions trigger the onAppHide event
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
        console.debug(`Start clean up temp file directory`)
        await this.cache.clearTempDirFile()
      }
    }
    const clearExtraDataCache = async ()=> {
      if(await this.globalTaskTimeoutCheck()){
        console.debug('Start check invalid cached data for extra data')
        try {
          const cardIds = await this.getCardIds()
          const localExtraDataCache = await this.cache.getExtraDatas()
          const invalidIds = Object.keys(localExtraDataCache).filter(e=>!cardIds.includes(e))
          if(invalidIds.length){
            console.debug(`Delete invalid extra data cache ：${invalidIds.length} rows`)
            await this.cache.deleteCardExtraData(invalidIds)
          }
        } catch (error) {
          console.error('clearExtraDataCache:',error)
        }
      }
    }
    const clearCardImageCache = async ()=> {
      if(await this.globalTaskTimeoutCheck()){
        console.debug('Start check invalid cached data for images')
        try {
          const imageIds = await this.getImageIds()
          console.debug(`Delete invalid image cache ：${imageIds.length} rows`)
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

  getUseLanguage(){
    return this.UseLanguage
  }

  async setUseLanguage(lang:UseLanguageType){
    this.UseLanguage = lang
    return this.setLocalData('USE_LANG', lang)
  }

  // unused
  async saveCurrentUserCode(userCode){
    if(!userCode) return
    return this.cache.setLocalData('LAST_LOGIN_UID', userCode)
  }

  async checkLikeCardNeedSync(){
    const homeDataCache = await this.cache.getHomeData()
    if(!homeDataCache || homeDataCache?.data?.cateList?.length === 0) return true
    if(this.likeListCacheTimeoutCheck(homeDataCache.cacheTime)){
      console.debug('Home data cache timeout, doing data sync check')
    }else{
      console.debug('Home data -> likeList Caching is valid')
      return false 
    }
    const likeList = homeDataCache.data.likeList
    const remoteLikeList = await this.getLikeCardIds()
    console.debug('checkLikeCardNeedSync', likeList.length, remoteLikeList.length)
    // todo: Now only check the quantity, and later we need to consider the case of different IDs
    if(remoteLikeList.length && remoteLikeList.length !== likeList.length) return true
    // If the data has not changed, but the time has expired, the cached time is updated
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

  // unused
  async checkNeverLogin(){
    const loginUserId = await this.cache.getLocalData<string>('LAST_LOGIN_UID')
    return !loginUserId
  }

  openCustomerService(){
    // temp solve
    wx.miniapp.launchMiniProgram({
      userName: 'gh_be19db4e969f',
      path: 'pages/about/contact/index?openService=1',
      miniprogramType: 0,
      success: console.log,
      fail: console.log
    })
    
    // need weixin open active
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
        if(!pic._url || !await file.checkAccess(pic._url)) throw Error(this.t_e('share_error'))
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

  buildTagsInfo(tags){
    const builtInTags = this.getCardConfig('defaultTags')
    // i18n builder
    tags.map(tag=>{
      const builtInTag = builtInTags.find(e=>e.name === tag.name)
      tag['label'] = builtInTag ? this.t(tag.name, [], 'tag') : tag.name
      tag.xid = builtInTag?.xid || 99
    })
    tags = tags.sort((a,b)=>{
      if(a.xid === b.xid){
        return b.count - a.count
      }
      return a.xid - b.xid
    })
    // move oc to end
    const ocIdx = tags.findIndex(e=>e.name === 'oc')
    if(ocIdx !== -1){
      const [oc] = tags.splice(ocIdx,1)
      tags.push(oc)
    }

    return tags
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

    const {cancel, confirm} = await this.showChoose(this.t('content_check_desc'),{
      cancelText: this.t('go_detail'),
      confirmText: this.t('got_it')
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
    
    const {cancel, confirm} = await this.showChoose('read more help for share',{
      cancelText: 'Detail',
      confirmText: 'not show'
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

  async checkQuotaNotice(){
    return new Promise((resolve)=>{
      if(this.userManager.quota >= 0){
        return resolve("")
      }
      this.showNotice(this.t('need_quota',[],'quota'))
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
        label: this.t('buy_1000_coin',['1000'],'quota')
      })
    }
    return iapItems
  }

  async clearUserTagsCache(){
    await this.cache.deleteTags()
    this.publishTagChangeEvent()
  }

  //settings start
  //data
  //cache clear
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

  //data backup
  async exportCardData(){
    return this.invokeApi('exportData', {type: 'card'})
  }

  async deleteAccount(){
    await this.userManager.deleteAccount()
    await this.cache.deleteUser()
    await this.clearCacheData()
    return this.masterKeyManager.clear()
  }
  //settings end

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
        if(i==9) throw Error(this.t_e('check_timeout_retry'))
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
    throw Error(this.t_e('content_check_error'))
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
    throw Error(this.t_e('content_check_error'))
  }

  async getActiveInfo(){
    const activeInfo = await this.invokeApi('getSysConfig', 'active')
    const { content } = await this.invokeApi('getDoc', {_id: activeInfo.id})
    return {
      activeInfo,
      content
    }
  }

  async showActiveNotice(){
    await this.showConfirm(this.t('no_auth'), this.t('go_login'))
    return this.goToUserProfilePage()
  }
  
  async showSetMasterKeyNotice(){
    await this.showConfirm(this.t_k('not_set_key'), this.t('go_set'))
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

  // popup action
  showMiniNotice(msg){
    return showNotice(msg)
  }

  showNotice(msg:string, options?:any){
    return showChoose(this.t('tips'), msg, { showCancel: false, ...options})
  }

  async showConfirm(msg:string, confirmText?:string){
    const options = {}
    if(confirmText) options['confirmText'] = confirmText
    msg = msg.endsWith('?') ? msg : `${msg}?`
    const { confirm } = await showChoose(this.t('tips'), msg, options)
    return new Promise((resolve,_)=>confirm && resolve(confirm))
  }

  async showChoose(msg:string, options?:WechatMiniprogram.ShowModalOption){
    return showChoose(this.t('tips'), msg, options)
  }
}

function getAppManager(){
  return AppManager.getInstance<AppManager>()
}

export {
  getAppManager
}