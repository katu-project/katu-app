import { loadData, showSuccess, navigateTo, showError } from "@/utils/index"
import { getUserManager } from '@/class/user'
import { getAppManager } from '@/class/app'
const user = getUserManager()
const app = getAppManager()

Page({
  data: {
    setMasterKey: false,
    config_security_rememberPassword: false,
    config_security_lockOnExit: true,
    config_security_setRecoveryKey: false
  },

  onShow(){
    this.loadData()
  },
  loadData(){
    const {config} = user
    this.setData({
      setMasterKey: app.user.setMasterKey,
      config_security_rememberPassword: config?.security.rememberPassword,
      config_security_lockOnExit: config?.security.lockOnExit,
      config_security_setRecoveryKey: config?.security.setRecoveryKey,
    })
  },
  tapToConfig(e){
    const configItem = {
      key: e.currentTarget.dataset.key,
      value: e.detail.value
    }
    loadData(user.applyConfig,configItem,{returnFailed: true}).then(()=>{
      showSuccess('修改成功')
      if(configItem.key === 'config_security_rememberPassword' && configItem.value === false){
        app.clearMasterKey()
      }
      this.setData({
        [configItem.key]: configItem.value
      })
    }).catch(err=>{
      this.loadData()
      showError(err.message)
    })
  },
  tapToPage({currentTarget:{dataset:{page}}}){
    navigateTo(page)
  },
  tapToReadDoc(e){
    app.navToDoc(app.Config.doc.rememberKeyNotice)
  }
})