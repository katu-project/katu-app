const { navigateTo } = require("../../utils/index")

const globalData = getApp().globalData

Page({
  data: {
    logo: '/static/logo.svg',
    version: 'dev'
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
      'version': globalData.app.appVersion
    })
  },
  tapToChangeLog(){
    navigateTo('../change-log/index')
  },
  tapToDoc(){
    globalData.app.openUserUsageProtocol()
  }
})