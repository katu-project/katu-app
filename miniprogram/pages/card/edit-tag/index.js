const { navigateTo } = require("../../../utils/index")

// pages/card/edit-tag/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: []
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

  },
  onShow(){
    if(this.tempData){
      this.setData({
        list: this.data.list.concat({name:this.tempData})
      })
      this.tempData = null
    }
  },
  tapToAddTag(){
    navigateTo('../edit-content/index?sd=1')
  }
})