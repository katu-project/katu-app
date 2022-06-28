const { loadData } = require('../../utils/index')
const { navigateTo } = require('../../utils/action')
const globalData = getApp().globalData
Page({
  data: {
    list: [],
    likeList: [],
    notice: {
      newNotice: false,
      content: '暂无新消息'
    },
    isRefresh: false
  },

  onLoad(options) {
  },

  onReady() {
    this.loadData()
  },

  onShow() {
    setTimeout(()=>this.loadNotice(),2000)
    this.getTabBar().setData({selected: 0})
  },
  async loadData(){
    this.loadLikeList()
    this.loadCateList()
    
  },
  async loadLikeList(){
    this.setData({
      likeList: []
    })
    let likeList = await loadData(globalData.app.api.getLikeCard)
    likeList = likeList.map(card=>{
      if(card.encrypted){
        card.url = globalData.app.Constant.DefaultShowLockImage
      }else{
        card.url = globalData.app.Constant.DefaultShowImage
      }
      return card
    })
    this.setData({
      likeList
    })
    this.loadImage()
  },
  loadImage(){
    for (const idx in this.data.likeList) {
      const card = this.data.likeList[idx]
      if(!card.encrypted){
        wx.cloud.getTempFileURL({
          fileList: [{
            fileID: card.image[0].url
          }]
        }).then(({fileList:[file]})=>{
          const key = `likeList[${idx}].url`
          this.setData({
            [key]: file.tempFileURL + globalData.app.Config.imageMogr2
          })
        })
      }
    }
  },
  async loadCateList(){
    this.setData({
      list: []
    })
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
          'notice.time': new Date(notice.updateTime).toLocaleDateString(),
          'notice.newNotice': true,
          'notice.content': notice.content
        })
      }
    }).catch(console.warn)
  },
  tapToMarkRead(){
    if(!this.data.notice.id) {
      return this.hideModal('showNotice')
    }
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
  onBindRefresh(e){
    const key = e.currentTarget.dataset.view
    this[`load${key}List`]().then(()=>{
      this.setData({
        isRefresh: false
      })
    })
  },
  onShareAppMessage(){},
  hideModal(name){
    this.setData({
      [name]: false
    })
  }
})