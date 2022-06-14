const { loadData, showSuccess, navigateTo } = require("../../../utils/index")
const globalData = getApp().globalData

Page({

  /**
   * 页面的初始数据
   */
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
        console.log('clearMasterKey');
        globalData.app.clearMasterKey()
      }
      globalData.app.loadUserConfig(configItem)
    })
  },
  tapToMasterKey(){
    navigateTo('./master-key/index')
  }
})