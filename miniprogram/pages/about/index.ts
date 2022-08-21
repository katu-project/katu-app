const globalData = getApp().globalData
const { navigateTo } = globalData.utils

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
  tapToDoc({currentTarget:{dataset:{key}}}){
    if(key == 'usage'){
      globalData.app.openUserUsageProtocol()
    }else{
      globalData.app.openUserPrivacyProtocol()
    }
  }
})