const { navigateTo } = require("../../utils/index")

const globalData = getApp().globalData

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
        icon: 'unlock',
        title: '安全',
        url: 'security'
      },
      {
        icon: 'repair',
        title: '调试',
        url: '../debug',
        hide: true
      }
    ]
  },
  onLoad(options) {

  },
  onReady() {
    this.setData({
      'menu[3].hide': !globalData.app.isDev
    })
  },
  onShow() {

  },
  tapToPage(e){
    const page = e.currentTarget.dataset.page
    navigateTo(`./${page}/index`)
  }
})