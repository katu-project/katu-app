import { getAppManager } from '@/controller/app'
import { hasWechatInstall } from '@/utils/index'
const app = getAppManager()

Page({
  data: {
    email: app.getConfig('contacts').email
  },
  onLoad(e) {
    if(e.openService){
      app.showNotice('由于微信限制\n请点击上方按钮打开在线客服')
    }
  },
  onReady() {

  },
  onShow() {

  },
  async tapToOpenService(){
    const hasInstall = await hasWechatInstall().catch(console.warn)
    if(!hasInstall){
      app.showMiniNotice('未安装微信')
      return
    }
    app.openCustomerService()
  }
})