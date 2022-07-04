const globalData = getApp().globalData
const { loadData, navigateTo, showSuccess, showNotice } = require('../../utils/index')
const { activeAccount } = require('../../api')

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
    if(this.data.user.nickName !== globalData.app.user.nickName || this.data.user.avatarUrl !== globalData.app.user.avatarUrl){
      this.setData({
        'user.avatarUrl': globalData.app.user.avatarUrl,
        'user.nickName': globalData.app.user.nickName,
      })
    }

    globalData.app.getUsageStatistic().then(stats=>{
      this.setData({
        usedCardCount: stats.usedCardCount ||  0,
        usedEncryptedCardCount: stats.usedEncryptedCardCount || 0
      })
    })

    this.getTabBar().setData({selected: 2})
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
        loadData(activeAccount, {cloudId: cloudID}).then(()=>{
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
  async tapToShowActiveTip(){
    await this.loadActiveData()
    navigateTo(`../qa/detail/index?id=${this.data.activeInfo.tip}`)
  },
  tapToItem(e){
    const item = e.currentTarget.dataset.item
    navigateTo(item.url || item)
  },
  tapToReadDoc(e){
    navigateTo(`../qa/detail/index?id=${e.currentTarget.dataset.item.id}`)
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