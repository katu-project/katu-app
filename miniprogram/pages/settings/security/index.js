const { loadData, showSuccess, navigateTo } = require("../../../utils/index")
const globalData = getApp().globalData

Page({

  /**
   * 页面的初始数据
   */
  data: {
    setMasterKey: false,
    config_security_askKeyOnAny: false,
    config_security_lockOnExit: true,
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  onShow(){
    const {app:{user:{config}}} = globalData
    this.setData({
      setMasterKey: globalData.app.user.setMasterKey,
      config_security_askKeyOnAny: config.security.askKeyOnAny,
      config_security_lockOnExit: config.security.lockOnExit
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
  },
  tapToMasterKey(){
    navigateTo('./master-key/index')
  }
})