const { getCard } = require('../../api')
const { loadData } = require('../../utils/index')
const { showChoose, navigateTo } = require('../../utils/action')
const globalData = getApp().globalData
Page({
  data: {
    list: []
  },

  onLoad(options) {
   
  },

  onReady() {
    this.loadCard()
  },

  onShow() {
    
  },
  async loadCard(){
    const list = await loadData(getCard)
    this.setData({
      list
    })
  },
  goCardDetail(e){
    navigateTo(`/pages/card/detail/index?id=${e.currentTarget.dataset.item._id}`)
  },
  goAddCard(){
    navigateTo('/pages/card/add/index')
  },
  goProfile(){
    navigateTo('/pages/profile/index')
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
  onShareAppMessage() {

  }
})