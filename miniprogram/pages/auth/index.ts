import { appleLogin, hasWechatInstall, loadData, showLoading, weixinMiniProgramLogin } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const user = getUserManager()

Page({
  data: {
    activeInfo: {},
    showOtherLogin: false,
    emailLogin:{
      email: '',
      code: '',
      sendCode: false,
      verifyId: ''
    }
  },

  onLoad() {
  },

  onReady() {
  },

  onShow() {
  },

  // 小程序快速注册
  tapToSignup(){
    return this.showActiveInfo()
  },

  async tapToActiveAccount(){
    this.hideActiveNotice()
    await loadData(user.activeAccount, {}, '正在创建账号')
    user.emit('userChange')
    await app.showNotice("账户已激活，可以体验完整功能")
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
  onInput(e){
    this.setData({
      [`emailLogin.${e.currentTarget.dataset.key}`]: e.detail.value
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
    if(type === 'apple') return this.goAppleLogin()
    if(type === 'mp') return this.goMpLogin()
  },

  async goAppleLogin(){
    const hideLoading = await showLoading('等待授权', -1, false)
    try {
      const code = await appleLogin()
      await hideLoading()
      await loadData(app.loadUserByCode, code, '获取用户信息')
      app.emit('loginChange', true)
      await app.showNotice("Apple 授权成功")
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
    const hasInstall = await hasWechatInstall().catch(console.warn)
    if(!hasInstall){
      app.showMiniNotice('未安装微信')
      return
    }
    try {
      const code = await weixinMiniProgramLogin()
      await loadData(app.loadUserByCode, code, '获取用户信息')
      app.emit('loginChange', true)
      await app.showNotice("小程序授权成功")
      app.navigateBack()
    } catch (err:any) {
      console.log('weixinMiniProgramLogin:', err)
      app.showNotice(err.message||'授权失败')
    }
  },

  async tapToSendEmailCode(){
    if(!this.checkToc()) return
    const {verifyId} = await loadData(app.api.sendEmailVerifyCode, {
      email: this.data.emailLogin.email
    })
    await app.showMiniNotice('验证码已发送')
    this.setData({
      'emailLogin.sendCode': true,
      'emailLogin.verifyId': verifyId
    })
  },

  async tapToEmailLogin(){
    if(!this.data.emailLogin.code || !this.data.emailLogin.verifyId){
      app.showMiniNotice('输入有误')
      return
    }
    
    const { token } = await loadData(app.api.activeAccountWithEmail,{
      code: this.data.emailLogin.code,
      verifyId: this.data.emailLogin.verifyId
    })
    await app.setLocalData('KATU_APP_TOKEN', token)
    await app.showNotice('登录成功，即将返回')
    app.reLaunch()
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

  checkToc(){
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
    if(!this.data.toc_2){
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