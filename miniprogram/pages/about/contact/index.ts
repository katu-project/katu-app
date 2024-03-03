import { getAppManager } from '@/controller/app'
import { hasWechatInstall } from '@/utils/index'
const app = getAppManager()

Page({
  data: {
    showCustomerService: true,
    email: app.getConfig('contacts').email
  },
  onLoad(e) {
    if(e.openService){
      app.showNotice('由于微信限制\n请点击上方按钮打开在线客服')
    }
  },
  async onReady() {
    if(app.isApp){
      const hasInstall = await hasWechatInstall().catch(console.warn)
      if(!hasInstall){
        this.setData({
          showCustomerService: false
        })
      }  
    }
  },
  onShow() {

  },
  async tapToOpenService(){
    app.openCustomerService()
  }
})