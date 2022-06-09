const { loadData } = require('../../utils/index')
const { navigateTo } = require('../../utils/action')
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
    this.getTabBar().setData({selected: 0})
  },
  async loadCard(){
    const list = await loadData(globalData.app.getCardSummary)
    this.setData({
      list
    })
  },
  tapToSearch(){
    navigateTo('../card/list/index', true)
  },
  tapToCardList(e){
    navigateTo('../card/list/index?tag='+e.currentTarget.dataset.tag, true)
  },
  goCardDetail(e){
    navigateTo(`/pages/card/detail/index?id=${e.currentTarget.dataset.item._id}`)
  },
  goAddCard(){
    navigateTo('/pages/card/add/index', true)
  },
  goProfile(){
    navigateTo('/pages/profile/index', true)
  },
  onPullDownRefresh() {
    this.setData({
      list: []
    })
    this.loadCard().then(wx.stopPullDownRefresh)
  },
  onShareAppMessage() {

  }
})