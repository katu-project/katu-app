const { getDoc } = require('../../api')
const { loadData } = require('../../utils/index')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: []
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
    loadData(getDoc, {field:{title: true}}).then(docs=>{
      this.setData({
        list: docs
      })
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },
  tapToDetail(e){
    wx.navigateTo({
      url: './detail?id='+ e.currentTarget.dataset.key,
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