const globalData = getApp().globalData
const { loadData, navigateTo, showSuccess, showLoading, showNotice } = require('../../utils/index')
const { activeAccount } = require('../../api')

Page({
  data: {
    user: {},
    usedCardCount: 0,
    usedEncryptedCardCount: 0,
    app: {
      logo: '/static/logo-t.svg',
      version: 'dev',
    },
    qrUrl: '',
    profileList: [
      {
        icon: 'settings',
        name: '设置',
        url: '../settings/index'
      },
      {
        icon: 'question',
        name: '使用帮助 ( Q&A )',
        url: '../qa/index'
      },
      {
        icon: 'info',
        name: '关于卡兔',
        url: ''
      }
    ]
  },
  onLoad(options) {
  },
  onReady() {
    this.loadAppInfo()
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
  loadAppInfo(){
    this.setData({
      'app.version': globalData.app.appVersion
    })
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
          this.updateUserInfo()
        })
      },
      fail: err => {
        console.log(err);
        showNotice('取消授权')
      }
    })
  },
  updateUserInfo(){
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
    if(item.url){
      navigateTo(item.url)
    }else{
      this.setData({
        showAbout: true
      })
    }
  },
  tapOpenJoinGroup(){
    this.setData({
      showJoinGroup: true
    })
  },
  hideModal(e){
    const key = e.currentTarget.dataset.key
    this.setData({
      [key]: false
    })
  }
})