const globalData = getApp().globalData
const { loadData } = require('../../utils/index')

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
    const info = wx.getAccountInfoSync()
    console.log(info);
    this.setData({
      'app.version': info.miniProgram.version || 'dev'
    })
  },
  tapToSettings(){
    wx.navigateTo({
      url: '../settings/index',
    })
  },
  tapToQA(){
    wx.navigateTo({
      url: '../qa/index',
    })
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