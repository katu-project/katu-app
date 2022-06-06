const globalData = getApp().globalData
const { loadData, navigateTo, showSuccess, showLoading, showNotice } = require('../../utils/index')
const { activeAccount } = require('../../api')

Page({
  data: {
    user: {},
    usedCardCount: 0,
    usedEncryptedCardCount: 0,
    app: {
      logo: '/static/logo.svg',
      version: 'dev',
    },
    qrUrl: '',
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
  tapToSettings(){
    navigateTo('../settings/index')
  },
  tapToQA(){
    navigateTo('../qa/index')
  },
  tapOpenAbout(){
    this.setData({
      showAbout: true
    })
  },
  tapOpenJoinGroup(){
    this.setData({
      showJoinGroup: true
    })
  },
  tapToPreview(){
    wx.previewImage({
      urls: [this.data.qrUrl]
    })
  },
  hideModal(e){
    const key = e.currentTarget.dataset.key
    this.setData({
      [key]: false
    })
  }
})