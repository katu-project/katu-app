import { loadData, showChoose, showNotice } from "@/utils/index"
import { getAppManager } from '@/class/app'
import { APP_ENTRY_PATH } from '@/const'

const app = getAppManager()
import api from '@/api'

export {}

Page({
  data: {

  },
  onLoad() {

  },
  onReady() {
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
    if(!app.user.isActive) {
      showNotice("账户未激活，无需删除")
      return
    }
    loadData(api.removeAccount).then(()=>{
      app.clearUserInfo()
      showChoose('操作成功','账户删除成功',{
        showCancel: false
      }).then(()=>{
        wx.reLaunch({
          url: `/pages/${APP_ENTRY_PATH}`,
        })
      })
    })
  }
})