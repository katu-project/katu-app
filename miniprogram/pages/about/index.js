const { navigateTo } = require("../../utils/index")

const globalData = getApp().globalData

Page({
  data: {
    logo: '/static/logo.svg',
    version: 'dev',
    userDocId: 'f6e08a6462b0879e08d6b0a15725ecbb'
  },
  onLoad(options) {

  },
  onReady() {
    this.loadAppInfo()
  },
  onShow() {

  },
  loadAppInfo(){
    this.setData({
      'app.version': globalData.app.appVersion
    })
  },
  tapToDoc(){
    navigateTo(`../qa/detail/index?id=${this.data.userDocId}`)
  }
})