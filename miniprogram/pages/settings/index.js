const globalData = getApp().globalData

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isDev: false
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
    this.setData({
      isDev: globalData.app.isDev
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },
  tapToSecurity(){
    wx.navigateTo({
      url: './security/index',
    })
  },
  tapToDebug(){
    wx.navigateTo({
      url: '../debug/index',
    })
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})