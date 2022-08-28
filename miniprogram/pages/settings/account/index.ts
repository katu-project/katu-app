import { loadData, showChoose, showNotice } from "../../../utils/index"
const globalData = getApp().globalData

Page({
  data: {

  },
  onLoad(options) {

  },
  onReady() {
    this.app = globalData.app
  },

  tapToDeleteAccount(){
    showChoose('警告','此操作将删除你在卡兔上的所有数据！',{
      confirmText: '确认删除',
      confirmColor: '#FF0000',
    }).then(({cancel})=>{
      if(cancel) return
      this.startDeleteAccount()
    })
  },
  startDeleteAccount(){
    if(!this.app.user.isActive) {
      return showNotice("账户未激活，无需删除")
    }
    loadData(this.app.api.removeAccount).then(()=>{
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