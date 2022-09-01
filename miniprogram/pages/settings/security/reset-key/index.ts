import { showError, loadData, showChoose, navigateTo } from '../../../../utils/index'
const globalData = getApp().globalData

export {}

Page({
  data: {
    setRecoveryKey: false,

  },
  onLoad(options) {

  },
  onReady() {

  },
  onShow() {
    const setData = {
      setRecoveryKey: false
    }
    if(globalData.app.user.config.security.setRecoveryKey){
      setData.setRecoveryKey = globalData.app.user.config.security.setRecoveryKey
    }
    this.setData(setData)
  },
  tapToPage({currentTarget:{dataset:{page}}}){
    navigateTo(page)
  },
  tapToDoc(){
    globalData.app.navToDoc(globalData.app.Config.doc.forgetKeyNotice)
  }
})