import { getAppManager } from '@/controller/app'
const app = getAppManager()

app.createPage({
  i18n: {
    page: ['about','contactUs']
  },

  openService: false,

  data: {
    showCustomerService: false,
    email: app.getConfig('contacts').email
  },
  
  onLoad(e) {
    if(e.openService){
      this.openService = true
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
    if(this.openService){
      app.showNotice(this.t('help_tips'))
    }
  },

  onShow() {

  },

  async tapToOpenService(){
    app.openCustomerService()
  }
})