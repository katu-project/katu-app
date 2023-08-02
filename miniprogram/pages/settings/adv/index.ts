import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
const app = getAppManager()

Page({
  data: {
    user: app.user

  },

  onLoad() {

  },

  onReady() {

  },

  onShow() {

  },

  async tapToCreateToken(){
    await app.showConfirm('生成新密钥将导致旧密钥失效')
    const token = await loadData(app.createDevToken)
    const showTokenText = `${token.slice(0,5)}****${token.slice(-5)}`
    const { confirm } = await app.showChoose(`新密钥已生成:\n${showTokenText}`,{
      confirmText: '复制密钥'
    })
    if(confirm){
      wx.setClipboardData({
        data: token
      })
    }
  }
})