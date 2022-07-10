const { loadData, showSuccess } = require("../../../utils/index")
const globalData = getApp().globalData

Page({
  data: {
    config_general_defaultUseEncrytion: false,
    config_general_useDefaultTag: true
  },
  onShow(){
    const {app:{user:{config}}} = globalData
    this.setData({
      config_general_defaultUseEncrytion: config.general.defaultUseEncrytion,
      config_general_useDefaultTag: config.general.useDefaultTag
    })
  },
  tapToConfig(e){
    const configItem = {
      key: e.currentTarget.dataset.key,
      value: e.detail.value
    }
    loadData(globalData.app.api.updateUserConfig, configItem).then(()=>{
      showSuccess('修改成功')
      globalData.app.reloadUserConfig(configItem)
    })
  }
})