import { getAppManager } from '@/controller/app'
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
    app.goChangeLogPage()
  },

  tapToContactUs(){
    app.goContactUsPage()
  },

  tapToDoc({currentTarget:{dataset:{key}}}){
    if(key == 'usage'){
      app.openUserUsageProtocol()
    }else{
      app.openUserPrivacyProtocol()
    }
  }
})