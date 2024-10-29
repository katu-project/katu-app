import { appleLogin, loadData, showLoading, weixinMiniProgramLogin } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { CreateEventBehavior } from '@/behaviors/event'
import { getUserManager } from '@/controller/user'

const app = getAppManager()
const user = getUserManager()

app.createPage({
  i18n: {
    page: ['auth']
  },

  data: {
    activeInfo: {},
    showOtherLogin: false,
    showMpLogin: true,
    loginMode:{
      key: 'tel'
    },
    loginState:{
      value: '',
      code: '',
      sendCode: false,
      verifyId: '',
      telCode: '+86'
    },
    toc_1: '',
    toc_2: ''
  },

  behaviors: [
    CreateEventBehavior('auth')
  ],

  async onLoad() {
    const useLang = app.getUseLanguage()
    if(useLang && useLang === 'en'){
      this.tapToChangeLoginMode()
    }
    app.hasInstallWechat().then(hasInstall=>{
      if(!hasInstall){
        this.setData({
          showMpLogin: false
        })
      }
    })
  },

  onReady() {
  },

  onShow() {
  },

  onEventTelCodeSelected(code){
    this.setData({
      'loginState.telCode': code
    })
  },

  // wx mini app sign up
  async tapToMpSignup(){
    await user.loadInfo({skipCache:true})
    if(user.isActive) {
      await app.showNotice(this.t('login_success'))
      app.reLaunch()
      return
    }
    return this.showActiveInfo()
  },

  async tapToActiveAccount(){
    this.hideActiveNotice()
    await loadData(app.loginWithMp, undefined, this.t('activate_account'))
    await app.showNotice(this.t('account_activated'))
    app.navigateBack()
  },

  async showActiveInfo(){
    await this.loadActiveData()
    this.setData({
      showActiveInfo: true
    })
  },

  hideActiveNotice(){
    this.setData({
      showActiveInfo: false
    })
  },
  
  async loadActiveData(){
    this.setData({
      activeInfo: await app.getActiveInfo()
    })
  },

  tapToReadDoc(e){
    const doc = e.currentTarget.dataset.doc
    switch (doc) {
    case 'privacy':
      app.openUserPrivacyProtocol()
      break;
    case 'toc':
      app.openUserUsageProtocol()
      break;
    default:
      app.showNotice(this.t('unknown_error'))
      break;
    }
  },

  // native app signin/up 
  tapToChangeLoginMode(){
    if(this.data.loginMode.key === 'tel'){
      this.setData({
        'loginMode.key': 'email'
      })
    }else{
      this.setData({
        'loginMode.key': 'tel'
      })
    }
  },

  tapToChooseTelCode(){
    app.goTelCodeSelectPage()
  },

  onInput(e){
    this.setData({
      [`loginState.${e.currentTarget.dataset.key}`]: e.detail.value
    })
  },

  tapToShowLoginDialog(){
    this.setData({
      showOtherLogin: true
    })
  },

  tapToOtherLogin(e){
    const type = e.currentTarget.dataset.key
    this.setData({
      showOtherLogin: false
    })
    if(!this.checkToc(true)) return
    if(type === 'apple') return this.goAppleLogin()
    if(type === 'mp') return this.goMpLogin()
    return
  },

  async goAppleLogin(){
    const hideLoading = await showLoading(this.t('wait_auth'), -1, false)
    try {
      const code = await appleLogin()
      await hideLoading()
      await loadData(app.loginWithCode, code, this.t('fetch_user_info'))
      await app.showNotice(this.t('auth_success'))
      app.navigateBack()
    } catch (err:any) {
      await hideLoading()
      console.error('appleLogin:', err)
      await app.showNotice(this.t('auth_failed'))
    }
  },

  async goMpLogin(){
    try {
      const code = await weixinMiniProgramLogin()
      await loadData(app.loginWithCode, code, this.t('fetch_user_info'))
      await app.showNotice(this.t('auth_success'))
      app.navigateBack()
    } catch (err:any) {
      console.error('weixinMiniProgramLogin:', err)
      await app.showNotice(this.t('auth_failed'))
    }
  },

  async tapToSendCode(){
    if(!this.checkToc()) return
    const {verifyId} = await loadData(app.sendLoginVerifyCode, {
      type: this.data.loginMode.key,
      value: (this.data.loginMode.key === 'tel' ? this.data.loginState.telCode : '') + this.data.loginState.value 
    })
    await app.showMiniNotice(this.t('sms_sent'))
    this.setData({
      'loginState.sendCode': true,
      'loginState.verifyId': verifyId
    })
  },

  async tapToLogin(){
    if(!this.data.loginState.value || !this.data.loginState.code){
      app.showMiniNotice(this.t('input_error'))
      return
    }
    if(!this.checkToc()) return
    await loadData(app.loginWithVerifyCode,{
      type: this.data.loginMode.key,
      value: (this.data.loginMode.key === 'tel' ? this.data.loginState.telCode : '') + this.data.loginState.value,
      code: this.data.loginState.code,
      verifyId: this.data.loginState.verifyId
    })
    await app.showNotice(this.t('login_and_back'))
    app.navigateBack()
  },

  tapToc(e){
    const key = e.currentTarget.dataset.key
    this.setData({
      [key]: !this.data[key]
    })
  },

  tapToReadPrivacy(){
    return app.openUserPrivacyProtocol()
  },

  tapToReadTos(){
    return app.openUserUsageProtocol()
  },

  tapToOpenHelper(){
    return app.goDocListPage('account')
  },

  checkToc(skipToc2?:boolean){
    if(!this.data.toc_1){
      this.setData({
        showTocAnima_1: true
      })
      setTimeout(() => {
        this.setData({
          showTocAnima_1: false
        })
      }, 300)
      return false
    }
    if(!skipToc2 && !this.data.toc_2){
      this.setData({
        showTocAnima_2: true
      })
      setTimeout(() => {
        this.setData({
          showTocAnima_2: false
        })
      }, 300)
      return false
    }
    return true
  }
})