import { navigateTo } from '@/utils/index'
import { getAppManager } from '@/class/app'
const app = getAppManager()

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
      'version': app.version
    })
  },
  tapToChangeLog(){
    navigateTo('../change-log/index')
  },

  tapToContactUs(){
    navigateTo('./contact/index')
  },

  tapToDoc({currentTarget:{dataset:{key}}}){
    if(key == 'usage'){
      app.openUserUsageProtocol()
    }else{
      app.openUserPrivacyProtocol()
    }
  }
})