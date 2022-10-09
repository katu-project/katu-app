import { loadData, showSuccess, navigateTo } from "@/utils/index"
import { getAppManager } from '@/class/app'
const app = getAppManager()
import api from '@/api'
export {}

Page({
  data: {
    setMasterKey: false,
    config_security_rememberPassword: false,
    config_security_lockOnExit: true,
    config_security_setRecoveryKey: false
  },

  onShow(){
    const {config} = app.user
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
    console.log(configItem)
    loadData(api.updateUserConfig, configItem).then(()=>{
      showSuccess('修改成功')
      if(configItem.key === 'config_security_rememberPassword' && configItem.value === false){
        app.clearMasterKey()
      }
      this.setData({
        [configItem.key]: configItem.value
      })
      app.reloadUserConfig(configItem)
    })
  },
  tapToPage({currentTarget:{dataset:{page}}}){
    navigateTo(page)
  },
  tapToReadDoc(e){
    app.navToDoc(app.Config.doc.rememberKeyNotice)
  }
})