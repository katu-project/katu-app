import { loadData } from "@/utils/index"
import { getUserManager } from '@/controller/user'
import { getAppManager } from '@/controller/app'
const user = getUserManager()
const app = getAppManager()

app.createPage({
  i18n: {
    page: ['settings','security']
  },

  data: {
    setMasterKey: false,
    config_security_rememberPassword: false,
    config_security_setRecoveryKey: false
  },

  onShow(){
    this.loadData()
  },
  
  loadData(){
    const {config} = user
    this.setData({
      setMasterKey: user.isSetMasterKey,
      config_security_rememberPassword: config?.security.rememberPassword,
      config_security_setRecoveryKey: config?.security.setRecoveryKey,
    })
  },

  tapToConfig(e){
    const configItem = {
      key: e.currentTarget.dataset.key,
      value: e.detail.value
    }
    loadData(user.applyConfig,configItem,{returnFailed: true}).then(()=>{
      app.showMiniNotice(this.t('config_success'))
      if(configItem.key === 'config_security_rememberPassword' && configItem.value === false){
        app.masterKeyManager.clear()
      }
    }).catch(()=>{
      this.loadData()
    })
  },

  tapToPage({currentTarget:{dataset:{page}}}){
    app.goToPage(page)
  },

  tapToReadDoc(){
    app.openRememberKeyNotice()
  }
})