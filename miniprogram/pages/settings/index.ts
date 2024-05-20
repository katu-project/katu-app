import { getAppManager } from '@/controller/app'
import { showLoading } from '@/utils/index'

const app = getAppManager()

Page({
  data: {
    menu: app.menu.settings
  },

  onLoad() {

  },

  onReady() {
    this.data.menu.map((group, idx)=>{
      const hideIdx = group.findIndex(e=>e.devOnly === true)
      if(hideIdx !== -1){
        this.setData({
          [`menu[${idx}][${hideIdx}].hide`]: !app.isDev
        })
      }
    })
  },

  onShow() {

  },

  tapToPage(e){
    const page = e.currentTarget.dataset.page
    app.goToPage(page.startsWith('/') ? page : `settings/${page}/index`)
  },

  async tapToLogout(){
    await app.showConfirm('确认退出登录？')
    app.logout()
    await showLoading('正在退出', 2000)
    await app.showNotice('已退出登录')
    app.navigateBack()
  }
})