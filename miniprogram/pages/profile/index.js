const globalData = getApp().globalData
const { loadData, navigateTo, showSuccess, showLoading, showNotice } = require('../../utils/index')
const { activeAccount } = require('../../api')

Page({
  data: {
    user: {},
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
    globalData.app.getUsageStatistic().then(stats=>{
      this.setData({
        usedCardCount: stats.usedCardCount ||  0,
        usedEncryptedCardCount: stats.usedEncryptedCardCount || 0
      })
    })

    this.getTabBar().setData({selected: 2})
  },
  tapUser(){
    if(this.data.user.isActive) return
    return this.goActiveAccount()
  },
  goActiveAccount(){
    showLoading('等待授权')
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: ({cloudID}) => {
        loadData(activeAccount, {cloudId: cloudID}).then(()=>{
          showSuccess("激活成功")
          this.reloadUserInfo()
        })
      },
      fail: err => {
        console.log(err);
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
  tapToShowActiveInfo(){
    showNotice("普通卡额度 +10张")
  },
  tapToItem(e){
    const item = e.currentTarget.dataset.item
    navigateTo(item.url || item)
  }
})