import { getAppManager } from '@/controller/app'
const app = getAppManager()

app.createPage({
  i18n: {
    page: ['about','contactUs']
  },

  data: {
    showCustomerService: false,
    email: app.getConfig('contacts').email
  },
  
  onLoad(e) {
    if(e.openService){
      app.showNotice('由于微信限制\n请点击上方按钮打开在线客服')
    }
  },

  async onReady() {
    app.hasInstallWechat().then(hasInstall=>{
      if(hasInstall){
        this.setData({
          showCustomerService: true
        })
      }
    })
  },

  onShow() {

  },

  async tapToOpenService(){
    app.openCustomerService()
  }
})