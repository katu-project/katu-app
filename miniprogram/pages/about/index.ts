import { getAppManager } from '@/controller/app'
import { file } from '@/utils/index'

const app = getAppManager()

app.createPage({
  i18n: {
    page: ['profile','about']
  },
  
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
  },

  enableDebug(){
    const debug = !wx.getAppBaseInfo().enableDebug
    console.error('enableDebug:', debug)
    wx.setStorage({
      key: 'KATU_DEBUG',
      data: true
    })
    wx.setEnableDebug({
      enableDebug: debug
    })
  },

  async showDebugLog(){
    console._log('showDebugLog')
    const logfile = `${wx.env.USER_DATA_PATH}/err.log`
    const text = await file.readFile(logfile, 'utf8')
    console._log(text)
  }
})