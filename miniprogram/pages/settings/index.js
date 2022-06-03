const globalData = getApp().globalData

Page({

  /**
   * 页面的初始数据
   */
  data: {
    menu: [
      {
        icon: 'apps',
        title: '通用',
        url: 'general'
      },
      {
        icon: 'profile',
        title: '账户',
        url: 'account'
      },
      {
        icon: 'unlock',
        title: '安全',
        url: 'security'
      },
      {
        icon: 'repair',
        title: '调试',
        url: '../debug',
        hide: true
      }
    ]
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
    console.log(globalData.app)
    this.setData({
      'menu[3].hide': !globalData.app.isDev
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },
  tapToPage(e){
    const page = e.currentTarget.dataset.page
    wx.navigateTo({
      url: `./${page}/index`,
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