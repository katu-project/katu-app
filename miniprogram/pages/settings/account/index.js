const { loadData } = require("../../../utils/index")

const globalData = getApp().globalData

Page({
  data: {

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
    this.app = globalData.app
  },

  tapToDeleteAccount(){
    wx.showModal({
      title: '警告',
      content: '注销账户将会删除你在卡兔上的所有数据！',
      confirmText: '确认注销',
      confirmColor: 'red',
      success: ({cancel}) => {
        if(cancel) return
        this.startDeleteAccount()
      }
    })
  },
  startDeleteAccount(){
    loadData().then(()=>{
      wx.showModal({
        title: '操作成功',
        content: '账户注销成功',
        showCancel: false,
        success: ()=>{
          wx.reLaunch({
            url: '/pages/home/index',
          })
        }
      })
    })
  }
})