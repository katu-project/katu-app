const { DefaultShowImage } = require('../../../const')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    tmpImagePath: DefaultShowImage
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.originImagePath = options.p
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    this.setData({
      tmpImagePath: this.originImagePath
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },
  goBack(){
    wx.navigateBack({})
  },
  useAndBack() {
    const pages = getCurrentPages()
    const prevPage = pages[pages.length-2]
    prevPage.resolveImagePath = this.data.tmpImagePath
    wx.navigateBack({})
  },
  async selectMethod(e){
    wx.showLoading({
      title: '处理中',
      mask: true
    })
    await this.processImage(parseInt(e.detail.value))
    wx.hideLoading({})
  },
  async processImage(idx){
    return new Promise(resolve=>{
      setTimeout(() => {
        resolve()
      }, 2000);
    })
  },
  showTip1(){
    console.log('s');
  },
  showTip2(){

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