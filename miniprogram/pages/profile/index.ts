import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const user = getUserManager()

Page({
  data: {
    user: {} as Partial<IUser>,
    menus: app.menu.profile,
    showCustomerService: true,
    DefaultUserAvatar: app.getConst('DefaultUserAvatar')
  },

  onLoad() {
    this.loadEvent()
  },

  async onReady() {
    app.emit('userLoad')
    app.hasInstallWechat().then(hasInstall=>{
      if(!hasInstall){
        this.setData({
          showCustomerService: false
        })
      }
    })
  },

  onShow() {
  },

  loadEvent(){
    app.on('userLoad',this.onEventUserLoad)
    app.on('loginChange', this.onEventLoginChange)
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

  async onEventUserLoad(reload){
    this.setData({
      'user.avatarUrl': app.getConst('DefaultUserAvatar')
    })
    if(reload){
      await user.reloadInfo()
    }
    this.setData({
      user: {
        nickName: user.nickName,
        avatarUrl: user.avatar,
        isActive: user.isActive,
        identifyCode: user.uid
      }
    })
  },

  async onEventLoginChange(login){
    if(login){
      user.emit('userLoad',true)
    }else{
      this.setData({
        user: {}
      })
      user.clearInfo()
    }
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