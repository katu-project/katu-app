import { loadData, showChoose, showNotice } from "@/utils/index"
import { getAppManager } from '@/class/app'
import { getUserManager } from '@/class/user'
import { APP_ENTRY_PATH } from '@/const'
import api from '@/api'

const app = getAppManager()
const user = getUserManager()

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
      user.clearInfo()
      app.clearMasterKey()
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