const { loadData, showSuccess, navigateTo } = require("../../../utils/index")
const globalData = getApp().globalData

Page({
  data: {
    setMasterKey: false,
    config_security_rememberPassword: false,
    config_security_lockOnExit: true,
  },

  onShow(){
    const {app:{user:{config}}} = globalData
    this.setData({
      setMasterKey: globalData.app.user.setMasterKey,
      config_security_rememberPassword: config.security.rememberPassword,
      config_security_lockOnExit: config.security.lockOnExit
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
  tapToMasterKey(){
    navigateTo('./master-key/index')
  },
  tapToReadDoc(e){
    globalData.app.navToDoc(globalData.app.Config.doc.rememberKeyNotice)
  }
})