const globalData = getApp().globalData
import { navigateTo } from '@/utils/index'

export {}

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