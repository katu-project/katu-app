const globalData = getApp().globalData
const { loadData } = require('../../utils/index')
const { activeAccount, getUser } = require('../../api')
const { showChoose, navigateTo, showInfo } = require('../../utils/action')
Page({
  data: {
    user: {
      canUseCardCount: 1,
      canUseEncryptedCardCount: 0
    },
    app: {
      logo: '/static/logo.svg',
      version: 'dev',
    },
    qrUrl: 'cloud://dev-4gglcut52bffa0ff.6465-dev-4gglcut52bffa0ff-1310995773/app/myqr.png',
  },
  onLoad(options) {
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    if(globalData.user){
      this.setData({
        user: globalData.app.user
      })
    }else{
      loadData().then(()=>{
        this.setData({
          user: globalData.user
        })
      })
    }
    
    this.loadAppInfo()
  },

  /**
   * 生命周期函数--监听页面显示
   */
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
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: ({cloudID}) => {
        loadData(activeAccount, {cloudId: cloudID}).then(()=>{
          showInfo("激活成功",2)
          this.updateUserInfo()
        })
      },
      fail: err => {
        console.log(err);
        showInfo('授权失败',1)
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
    showInfo("普通卡额度 +10张")
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