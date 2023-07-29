import { getAppManager } from '@/controller/app'
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
  }
})