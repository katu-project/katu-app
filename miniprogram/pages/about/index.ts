import { navigateTo } from '@/utils/index'
import { getAppManager } from '@/class/app'
const app = getAppManager()
export {}

Page({
  data: {
    logo: '/static/logo.svg',
    version: 'dev'
  },
  onLoad() {

  },
  onReady() {
    this.loadAppInfo()
  },
  onShow() {

  },
  loadAppInfo(){
    this.setData({
      'version': app.appVersion
    })
  },
  tapToChangeLog(){
    navigateTo('../change-log/index')
  },
  tapToDoc({currentTarget:{dataset:{key}}}){
    if(key == 'usage'){
      app.openUserUsageProtocol()
    }else{
      app.openUserPrivacyProtocol()
    }
  }
})