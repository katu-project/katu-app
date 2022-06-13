// pages/card/edit-content/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    content: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.returnContentKey = options.returnContentKey || 'tempData'
    if(options.value){
      this.setData({
        content: options.value
      })
    }
  },
  checkContent(){

  },
  tapToSetContent(){
    const pages = getCurrentPages()
    const prevPage = pages[pages.length-2]
    prevPage[this.returnContentKey] = this.data.content
    wx.navigateBack({})
  }
})