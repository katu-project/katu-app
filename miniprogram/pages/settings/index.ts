import { navigateTo } from "@/utils/index"
import { getAppManager } from '@/controller/app'
const app = getAppManager()

export {}

Page({
  data: {
    menu: [
      {
        icon: 'apps',
        title: '通用',
        url: 'general'
      },
      {
        icon: 'profile',
        title: '账户',
        url: 'account'
      },
      {
        icon: 'file',
        title: '数据',
        url: 'data'
      },
      {
        icon: 'unlock',
        title: '安全',
        url: 'security'
      },
      {
        icon: 'repair',
        title: '调试',
        url: '../../packages/debug/pages/index',
        hide: true
      }
    ]
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