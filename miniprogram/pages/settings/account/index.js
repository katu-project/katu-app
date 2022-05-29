const { loadData, showChoose } = require("../../../utils/index")
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
    showChoose('警告','注销账户将会删除你在卡兔上的所有数据！',{
      confirmText: '确认注销',
      confirmColor: '#FF0000',
    }).then(()=>{
      this.startDeleteAccount()
    })
  },
  startDeleteAccount(){
    loadData(this.app.removeAccount).then(()=>{
      this.app.clearUserInfo()
      showChoose('操作成功','账户注销成功',{
        showCancel: false
      }).then(()=>{
        wx.reLaunch({
          url: '/pages/home/index',
        })
      })
    })
  }
})