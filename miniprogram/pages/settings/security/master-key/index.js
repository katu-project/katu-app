const { request } = require('../../../../api')
const { showError } = require('../../../../utils/index')
const globalData = getApp().globalData
Page({

  /**
   * 页面的初始数据
   */
  data: {
    masterKey: '',
    masterKeyRepeat: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
  },
  checkInput(){

  },
  checkRepeatInput(){

  },
  setMasterKey(e){
    this.setData({
      masterKey : e.detail.value
    })
  },
  async setMasterKey(){
    const appManager = globalData.app
    if(appManager.user.setMasterKey){
      showError('已经设置主密码')
      return
    }

    if(!this.data.masterKey || this.data.masterKey !== this.data.masterKeyRepeat){
      showError('两次输入不一致')
      return
    }

    try {
      await appManager.checkOriginMasterKey(this.data.masterKey)
      const masterKey = await appManager.createMasterKey(this.data.masterKey)
      const masterKeyPack = await appManager.createMasterKey(masterKey)
      await request('user/markSetMasterKey', {keyPack: masterKeyPack})
      await appManager.setMasterKey(masterKey)
      await appManager.reloadUserInfo()
      wx.showToast({
        title: '设置成功',
      })
    } catch (error) {
      console.log(error);
      wx.showToast({
        title: '设置出错',
        icon: 'error'
      })
    }
  },
})