const { loadData } = require('../../utils/index')
const { navigateTo } = require('../../utils/action')
const globalData = getApp().globalData
Page({
  data: {
    list: [],
    notice: {
      newNotice: false,
      content: '暂无新消息'
    }
  },

  onLoad(options) {
   
  },

  onReady() {
    this.loadCard()
  },

  onShow() {
    this.loadNotice()
    this.getTabBar().setData({selected: 0})
  },
  async loadCard(){
    const list = await loadData(globalData.app.getCardSummary)
    this.setData({
      list
    })
  },
  loadNotice(){
    globalData.app.api.getNotice().then(notice=>{
      this.setData({
        'notice.newNotice': true,
        'notice.content': notice.content
      })
    }).catch(console.warn)
  },
  tapToMarkRead(){
    this.setData({
      'notice.newNotice': false
    })
    this.hideModal('showNotice')
  },
  tapToHideModal(e){
    this.hideModal(e.currentTarget.dataset.name)
  },
  tapToSearch(){
    navigateTo('../card/list/index', true)
  },
  tapToShowNotice(){
    const data = {showNotice: true}
    this.setData(data)
  },
  tapToCardList(e){
    navigateTo('../card/list/index?tag='+e.currentTarget.dataset.tag, true)
  },
  tapToCardDetail(e){
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

  },
  hideModal(name){
    this.setData({
      [name]: false
    })
  }
})