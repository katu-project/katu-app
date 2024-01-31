import { loadData, showLoading, weixinMiniProgramLogin } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const user = getUserManager()

Page({
  data: {
    activeInfo: {}
  },

  onLoad() {
  },

  onReady() {
  },

  onShow() {
  },

  tapToReadDoc(e){
    const {title,id} = e.currentTarget.dataset.item
    if(title == 'privacy'){
      return app.openUserPrivacyProtocol()
    }
    return app.navToDocPage(id)
  },

  async tapToActiveAccount(){
    this.hideActiveNotice()
    await loadData(user.activeAccount, {}, '正在创建账号')
    user.emit('userChange')
    await app.showNotice("账户已激活，可以体验完整功能")
    app.navigateBack()
  },

  async showActiveInfo(){
    await this.loadActiveData()
    this.setData({
      showActiveInfo: true
    })
  },

  hideActiveNotice(){
    this.setData({
      showActiveInfo: false
    })
  },
  
  async loadActiveData(){
    if(this.data.activeInfo.id) return
    const { activeInfo, content } = await loadData(app.getActiveInfo)
    this.setData({
      activeInfo,
      'activeInfo.notice': content
    })
  },

  tapToSignup(){
    return this.showActiveInfo()
  },

  async tapToLogin(){
    try {
      const res = await weixinMiniProgramLogin()
      console.log('weixinMiniProgramLogin',res)
      // todo: 授权成功不代表已经是激活的用户，还需要去判断是否激活并提示用户先创建账号
      const hideLoading = await showLoading('获取用户信息', -1)
      await user.loadInfo()
      await hideLoading()
      app.emit('loginChange', true)
      await app.showNotice("小程序授权成功")
      app.navigateBack()
    } catch (err:any) {
      console.log('weixinMiniProgramLogin', err)
      app.showNotice(err.message||'授权失败')
    }
  }
})