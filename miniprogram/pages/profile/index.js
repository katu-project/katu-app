const { loadData, navigateTo, showSuccess, showNotice } = require('../../utils/index')

const globalData = getApp().globalData

Page({
  data: {
    user: {},
    activeInfo: null,
    usedCardCount: 0,
    usedEncryptedCardCount: 0,
    profileList: [
      {
        icon: 'tag',
        name: '标签管理',
        url: '../card/edit-tag/index'
      },
      {
        icon: 'question',
        name: '使用帮助 ( Q&A )',
        url: '../qa/index'
      },
      {
        icon: 'info',
        name: '关于卡兔',
        url: '../about/index'
      }
    ]
  },
  onLoad(options) {
  },
  onReady() {
    this.setData({
      user: globalData.app.user
    })
  },
  onShow() {
    this.getTabBar().setData({selected: 2})
    this.checkRefreshUserData()
    this.loadCardUsageStatistic()
  },
  loadCardUsageStatistic(){
    globalData.app.api.usageStatistic().then(stats=>{
      this.setData({
        usedCardCount: stats.usedCardCount ||  0,
        usedEncryptedCardCount: stats.usedEncryptedCardCount || 0
      })
    })
  },
  tapUser(){
    if(this.data.user.isActive) {
      return this.tapToEditInfo()
    }
    return this.showActiveNotice()
  },
  tapToActiveAccount(){
    wx.showLoading({
      title: '等待获取授权',
    })
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: ({cloudID}) => {
        wx.hideLoading({})
        loadData(globalData.app.api.activeAccount, {cloudId: cloudID}).then(()=>{
          showSuccess("激活成功")
          this.reloadUserInfo()
          this.hideActiveNotice()
        })
      },
      fail: err => {
        wx.hideLoading({})
        showNotice('取消授权')
      }
    })
  },
  reloadUserInfo(){
    globalData.app.reloadUserInfo().then(()=>{
      this.setData({
        user: globalData.app.user
      })
    })
  },
  tapToEditInfo(){
    if(!this.data.user.isActive) return
    navigateTo('./edit/index')
  },
  checkRefreshUserData(){
    if(globalData.app.user && (this.data.user.nickName !== globalData.app.user.nickName || this.data.user.avatarUrl !== globalData.app.user.avatarUrl)){
      this.setData({
        'user.avatarUrl': globalData.app.user.avatarUrl,
        'user.nickName': globalData.app.user.nickName,
      })
    }
  },
  async tapToShowActiveTip(){
    await this.loadActiveData()
    globalData.app.navToDoc(this.data.activeInfo.tip)
  },
  tapToItem(e){
    const item = e.currentTarget.dataset.item
    navigateTo(item.url || item)
  },
  tapToReadDoc(e){
    globalData.app.navToDoc(e.currentTarget.dataset.item.id)
  },
  async showActiveNotice(){
    await this.loadActiveData()
    this.setData({
      showActiveNotice: true
    })
  },
  hideActiveNotice(){
    this.setData({
      showActiveNotice: false
    })
  },
  async loadActiveData(){
    if(this.data.activeInfo) return
    const activeInfo = await loadData(globalData.app.api.getAppConfig, 'active')
    const doc = await loadData(globalData.app.api.getDoc, {_id: activeInfo.id})
    this.setData({
      activeInfo,
      'activeInfo.notice': doc.content
    })
  }
})