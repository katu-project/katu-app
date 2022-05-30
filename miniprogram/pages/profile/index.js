const globalData = getApp().globalData
const { DefaultUserData } = require('../../class/app')
const { loadData, navigateTo, showSuccess, showLoading, showNotice } = require('../../utils/index')
const { activeAccount } = require('../../api')

Page({
  data: {
    user: DefaultUserData,
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
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})