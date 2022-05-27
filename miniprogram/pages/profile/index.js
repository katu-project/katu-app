const globalData = getApp().globalData
const { loadData } = require('../../utils/index')
const { showChoose, navigateTo, showInfo } = require('../../utils/action')
Page({
  data: {
    user: {},
    app: {
      logo: '/static/logo.svg',
      version: 'dev',
    },
    qrUrl: 'cloud://dev-4gglcut52bffa0ff.6465-dev-4gglcut52bffa0ff-1310995773/app/myqr.png',
  },

  /**
   * 生命周期函数--监听页面加载
   */
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
    showChoose('激活账户','激活账户能获得更多卡片额度').then(()=>{
      loadData().then(()=>{
        showInfo("激活成功")
      })
    })
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