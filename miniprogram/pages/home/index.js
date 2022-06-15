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
    setTimeout(this.loadNotice,2000)
    this.getTabBar().setData({selected: 0})
  },
  async loadCard(){
    const list = await loadData(globalData.app.api.getCardSummary)
    this.setData({
      list
    })
  },
  loadNotice(){
    globalData.app.api.getNotice().then(notice=>{
      if(!globalData.app.user.noticeReadLog.includes(notice._id)){
        this.setData({
          'notice.id': notice._id,
          'notice.newNotice': true,
          'notice.content': notice.content
        })
      }
    }).catch(console.warn)
  },
  tapToMarkRead(){
    if(!this.data.notice.id) return
    globalData.app.api.markRead(this.data.notice.id)
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
  onPullDownRefresh(){
    this.setData({
      list: []
    })
    this.loadCard().then(wx.stopPullDownRefresh)
  },
  onShareAppMessage(){},
  hideModal(name){
    this.setData({
      [name]: false
    })
  }
})