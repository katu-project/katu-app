const globalData = getApp().globalData

Page({
  data: {
    user: {},
    version: 'dev'
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
    if(globalData.user){
      this.setData({
        user: globalData.app.user
      })
      return
    }
    wx.showLoading({
      title: '加载数据',
    })
    setTimeout(() => {
      this.setData({
        user: globalData.user
      })
      wx.hideLoading({})
    }, 1000);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },
  goSettings(){
    wx.navigateTo({
      url: '../settings/index',
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