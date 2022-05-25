const { getCard } = require('../../api')
const { getAppManager } = require('../../class/app')
const { loadData } = require('../../utils/index')

Page({
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
    this.loadCard()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    
  },
  async loadCard(){
    const list = await loadData(getCard)
    this.setData({
      list
    })
  },
  goCardDetail(e){
    wx.navigateTo({
      url: '/pages/card/detail/index?id='+ e.currentTarget.dataset.item._id,
    })
  },
  goAddCard(){
    wx.navigateTo({
      url: '/pages/card/add/index',
    })
  },
  goProfile(){
    wx.navigateTo({
      url: '/pages/profile/index',
    })
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.setData({
      list: []
    })
    this.loadCard().then(wx.stopPullDownRefresh)
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