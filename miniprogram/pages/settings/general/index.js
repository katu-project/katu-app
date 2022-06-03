const { loadData, showSuccess } = require("../../../utils/index")
const globalData = getApp().globalData

Page({

  /**
   * 页面的初始数据
   */
  data: {
    config_general_defaultCreateCardType: true
  },
  onShow(){
    const {app:{user:{config}}} = globalData
    this.setData({
      config_general_defaultCreateCardType: config.general.defaultCreateCardType
    })
  },
  tapToConfig(e){
    const configItem = {
      key: e.currentTarget.dataset.key,
      value: e.detail.value
    }
    console.log(configItem)
    loadData(globalData.app.updateUserConfig, configItem).then(()=>{
      showSuccess('修改成功')
      globalData.app.loadUserConfig(configItem)
    })
  }
})