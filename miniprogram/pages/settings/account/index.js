const { loadData, showChoose, showNotice } = require("../../../utils/index")
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
    showChoose('警告','删除账户将会删除你在卡兔上的所有数据！',{
      confirmText: '确认删除',
      confirmColor: '#FF0000',
    }).then(()=>{
      this.startDeleteAccount()
    })
  },
  startDeleteAccount(){
    if(!this.app.user.isActive) {
      return showNotice("账户未激活，无需删除")
    }
    loadData(this.app.removeAccount).then(()=>{
      this.app.clearUserInfo()
      showChoose('操作成功','账户删除成功',{
        showCancel: false
      }).then(()=>{
        wx.reLaunch({
          url: '/pages/home/index',
        })
      })
    })
  }
})