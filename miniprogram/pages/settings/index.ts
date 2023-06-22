import { navigateTo } from "@/utils/index"
import { getAppManager } from '@/controller/app'
const app = getAppManager()

Page({
  data: {
    menu: app.menu.settings
  },
  onLoad() {

  },
  onReady() {
    this.setData({
      'menu[4].hide': !app.isDev
    })
  },
  onShow() {

  },
  tapToPage(e){
    const page = e.currentTarget.dataset.page
    navigateTo(page.startsWith('.') ? page : `./${page}/index`)
  }
})