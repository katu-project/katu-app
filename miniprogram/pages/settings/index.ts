import { getAppManager } from '@/controller/app'
import { showLoading, weixinLogout } from '@/utils/index'

const app = getAppManager()

Page({
  data: {
    menu: app.menu.settings
  },

  onLoad() {

  },

  onReady() {
    const hideIdx = this.data.menu.findIndex(e=>e.hide !== undefined)
    if(hideIdx !== -1){
      this.setData({
        [`menu[${hideIdx}].hide`]: !app.isDev
      })
    }
  },

  onShow() {

  },

  tapToPage(e){
    const page = e.currentTarget.dataset.page
    app.goToPage(page.startsWith('/') ? page : `settings/${page}/index`)
  },

  async tapToLogout(){
    await app.showConfirm('退出登录将清除用户本地数据')
    
    await weixinLogout().catch(console.log)
    
    app.emit('loginChange', false)
    await showLoading('正在退出', 2000)
    await app.showNotice('已退出登录')
    app.goToUserProfilePage()
  }
})