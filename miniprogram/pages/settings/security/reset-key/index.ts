import { navigateTo } from "@/utils/index"
import { getAppManager } from '@/class/app'
const app = getAppManager()

export {}

Page({
  data: {
    setRecoveryKey: false,

  },
  onShow() {
    const setData = {
      setRecoveryKey: false
    }
    if(app.user.config?.security.setRecoveryKey){
      setData.setRecoveryKey = app.user.config.security.setRecoveryKey
    }
    this.setData(setData)
  },
  tapToPage({currentTarget:{dataset:{page}}}){
    navigateTo(page)
  },
  tapToDoc(){
    app.navToDoc(app.Config.doc.forgetKeyNotice)
  }
})