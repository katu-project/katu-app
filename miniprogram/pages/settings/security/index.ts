import { loadData, showSuccess, navigateTo } from "../../../utils/index"
const globalData = getApp().globalData

Page({
  data: {
    setMasterKey: false,
    config_security_rememberPassword: false,
    config_security_lockOnExit: true,
    config_security_setRecoveryKey: false
  },

  onShow(){
    const {app:{user:{config}}} = globalData
    this.setData({
      setMasterKey: globalData.app.user.setMasterKey,
      config_security_rememberPassword: config.security.rememberPassword,
      config_security_lockOnExit: config.security.lockOnExit,
      config_security_setRecoveryKey: config.security.setRecoveryKey,
    })
  },
  tapToConfig(e){
    const configItem = {
      key: e.currentTarget.dataset.key,
      value: e.detail.value
    }
    console.log(configItem)
    loadData(globalData.app.api.updateUserConfig, configItem).then(()=>{
      showSuccess('修改成功')
      if(configItem.key === 'config_security_rememberPassword' && configItem.value === false){
        globalData.app.clearMasterKey()
      }
      this.setData({
        [configItem.key]: configItem.value
      })
      globalData.app.reloadUserConfig(configItem)
    })
  },
  tapToPage({currentTarget:{dataset:{page}}}){
    navigateTo(page)
  },
  tapToReadDoc(e){
    globalData.app.navToDoc(globalData.app.Config.doc.rememberKeyNotice)
  }
})