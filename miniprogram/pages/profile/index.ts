import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
import { CreateEventBehavior } from '@/behaviors/event'

const app = getAppManager()
const user = getUserManager()

app.createPage({
  i18n: {
    page: ['profile']
  },

  data: {
    user: {} as Partial<IUser>,
    menus: app.menu.profile,
    showCustomerService: true
  },

  behaviors: [
    CreateEventBehavior('profile')
  ],

  onLoad(){
  },

  onUnload(){
  },

  async onReady(){
    this.renderUserData()
    this.checkAndShowUserSerivce()
  },

  onShow() {
  },

  onEventUserProfileChange(){
    this.renderUserData()
  },

  onEventLoginChange(login){
    if(login){
      this.renderUserData()
    }else{
      this.setData({
        user: {}
      })
    }
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
      app.showMiniNotice(this.t('login_first'))
      return
    }
    return app.goToPage(item.url)
  },

  async tapToScan(){
    const resultJson = await loadData(app.scanQrcode,{},{ timeout: -1 })
    let msg = this.t('error_qrcode')

    if(resultJson.type === 'login'){
      await app.showConfirm(`${this.t('confirm_web_log')}?`)
      await loadData(async ()=>{
        await app.invokeApi('qrCodelogin', {
          loginCode: resultJson.code
        })
      })
      msg = this.t('auth_success')
    }
    app.showMiniNotice(msg)
  },

  async tapToOpenService(){
    app.openCustomerService()
  }
})