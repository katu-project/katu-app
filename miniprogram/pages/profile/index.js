const globalData = getApp().globalData
const { loadData } = require('../../utils/index')

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
    loadData().then(()=>{
      this.setData({
        user: globalData.user
      })
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },
  tapToSettings(){
    wx.navigateTo({
      url: '../settings/index',
    })
  },
  tapToQA(){
    wx.navigateTo({
      url: '../qa/index',
    })
  },
  tapOpenJoinGroup(){
    const qrUrl = 'cloud://dev-4gglcut52bffa0ff.6465-dev-4gglcut52bffa0ff-1310995773/app/myqr.png'
    wx.previewImage({
      urls: [qrUrl]
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