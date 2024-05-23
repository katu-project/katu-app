import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const user = getUserManager()

Page({
  data: {
    user: {} as Partial<IUser>,
    menus: app.menu.profile,
    showCustomerService: true
  },

  onLoad(){
    this.loadEvent('on')
  },

  onUnload(){
    this.loadEvent('off')
  },

  async onReady(){
    this.renderUserData()
    this.checkAndShowUserSerivce()
  },

  onShow() {
  },

  loadEvent(action:'on'|'off'){
    const onEventUserProfileChange = ()=>{
      this.renderUserData()
    }

    const onEventLoginChange = (login)=>{
      if(login){
        this.renderUserData()
      }else{
        this.setData({
          user: {}
        })
      }
    }

    Reflect.apply(app[action], app, ['userProfileChange', onEventUserProfileChange])
    Reflect.apply(app[action], app, ['loginChange', onEventLoginChange])
  },

  renderUserData(){
    this.setData({
      user: {
        nickName: user.nickName,
        avatarUrl: user.avatar,
        isActive: user.isActive,
        identifyCode: user.uid
      }
    })
  },

  async checkAndShowUserSerivce(){
    const hasInstall = await app.hasInstallWechat()
    if(!hasInstall){
      this.setData({
        showCustomerService: false
      })
    }
  },

  tapUser(){
    if(user.isActive) {
      return this.tapToEditInfo()
    }
    app.goToPage('auth/index')
  },

  tapToEditInfo(){
    if(!user.isActive) return
    app.goProfileEditPage()
  },

  async tapToItem(e){
    const item = e.currentTarget.dataset.item
    if(item.needActive && !user.isActive){
      app.showMiniNotice('登录后可用')
      return
    }
    return app.goToPage(item.url)
  },

  async tapToScan(){
    const resultJson = await loadData(app.scanQrcode,{},{ timeout: -1 })
    loadData(async ()=>{
      let msg = '未知二维码'
      if(resultJson.type === 'login'){
        await app.api.qrCodelogin({
          loginCode: resultJson.code
        })
        msg = '授权登录通过'
      }
      app.showNotice(msg)
    })
  },

  async tapToOpenService(){
    app.openCustomerService()
  }
})