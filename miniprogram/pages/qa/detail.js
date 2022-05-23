const { getDoc } = require('../../api')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    doc: {
      title: '',
      content: '',
      updateTime: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.id = options.id
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    wx.showLoading({
      title: '加载内容中',
    })
    getDoc({id:this.id}).then(doc=>{
      this.setData({
        doc
      })
      wx.hideLoading({})
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

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