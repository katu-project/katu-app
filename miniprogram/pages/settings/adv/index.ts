import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
const app = getAppManager()

Page({
  data: {
    user: app.user,
    showDevItem: false
  },

  onLoad() {

  },

  onReady() {

  },

  onShow() {

  },

  tapToPage({currentTarget:{dataset:{page}}}){
    app.goToPage(page)
  },

  async tapToCreateToken(){
    await app.showConfirm('确认获取新的 API 密钥?')
    const token = await loadData(app.createApiToken)
    const showTokenText = `${token.slice(0,5)}****${token.slice(-5)}`
    const { confirm } = await app.showChoose(`新密钥已生成:\n${showTokenText}`,{
      confirmText: '复制密钥'
    })
    if(confirm){
      app.setClipboardData(token)
    }
  },

  tapToShowDevItem(){
    this.setData({
      showDevItem: true
    })
  }
})