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
    activeInfo: {
      id: ''
    },
    showOtherLogin: false,
    showMpLogin: true,
    loginMode:{
      key: 'tel',
      label: '手机号',
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
    const useLang = await app.getUseLanguage()
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

  // 小程序快速注册
  async tapToMpSignup(){
    await user.loadInfo({skipCache:true})
    if(user.isActive) {
      await app.showNotice('登录成功')
      app.reLaunch()
      return
    }
    return this.showActiveInfo()
  },

  async tapToActiveAccount(){
    this.hideActiveNotice()
    await loadData(app.loginWithMp, undefined, '正在激活账户')
    await app.showNotice('账户已激活')
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
    if(this.data.activeInfo.id) return
    const { activeInfo, content } = await loadData(app.getActiveInfo)
    this.setData({
      activeInfo,
      'activeInfo.notice': content
    })
  },

  tapToReadDoc(e){
    const {title,id} = e.currentTarget.dataset.item
    if(title == 'privacy'){
      return app.openUserPrivacyProtocol()
    }
    return app.navToDocPage(id)
  },

  // app 端登录注册
  tapToChangeLoginMode(){
    if(this.data.loginMode.key === 'tel'){
      this.setData({
        'loginMode.key': 'email',
        'loginMode.label': '邮箱'
      })
    }else{
      this.setData({
        'loginMode.key': 'tel',
        'loginMode.label': '手机号'
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
    const hideLoading = await showLoading('等待授权', -1, false)
    try {
      const code = await appleLogin()
      await hideLoading()
      await loadData(app.loginWithCode, code, '获取用户信息')
      await app.showNotice("Apple ID 授权成功")
      app.navigateBack()
    } catch (err:any) {
      await hideLoading()
      console.log('appleLogin:', err)
      if(err.message){
        await app.showNotice(err.message)
      }else{
        await app.showMiniNotice('授权失败')
      }
    }
  },

  async goMpLogin(){
    try {
      const code = await weixinMiniProgramLogin()
      await loadData(app.loginWithCode, code, '获取用户信息')
      await app.showNotice("小程序 授权成功")
      app.navigateBack()
    } catch (err:any) {
      console.log('weixinMiniProgramLogin:', err)
      app.showNotice(err.message||'授权失败')
    }
  },

  async tapToSendCode(){
    if(!this.checkToc()) return
    const {verifyId} = await loadData(app.sendLoginVerifyCode, {
      type: this.data.loginMode.key,
      value: (this.data.loginMode.key === 'tel' ? this.data.loginState.telCode : '') + this.data.loginState.value 
    })
    await app.showMiniNotice('验证码已发送')
    this.setData({
      'loginState.sendCode': true,
      'loginState.verifyId': verifyId
    })
  },

  async tapToLogin(){
    if(!this.data.loginState.value || !this.data.loginState.code){
      app.showMiniNotice('输入有误')
      return
    }
    if(!this.checkToc()) return
    await loadData(app.loginWithVerifyCode,{
      type: this.data.loginMode.key,
      value: (this.data.loginMode.key === 'tel' ? this.data.loginState.telCode : '') + this.data.loginState.value,
      code: this.data.loginState.code,
      verifyId: this.data.loginState.verifyId
    })
    await app.showNotice('登录成功，即将返回')
    app.navigateBack()
  },

  tapToc(e){
    const key = e.currentTarget.dataset.key
    this.setData({
      [key]: !this.data[key]
    })
  },

  tapToReadPrivacy(){
    return app.navToDocPage('7027b65465ae31a8080fe48113c88ed1')
  },

  tapToReadTos(){
    return app.navToDocPage('f6e08a6462b0879e08d6b0a15725ecbb')
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