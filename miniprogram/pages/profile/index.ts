import { loadData, navigateTo, showSuccess } from '@/utils/index'
import { PAGES_MENU } from '@/const'
import api from '@/api'

import { getAppManager } from '@/class/app'
import { getUserManager } from '@/class/user'
const app = getAppManager()
const user = getUserManager()

Page({
  data: {
    user: {} as Partial<IUser>,
    activeInfo: {} as Partial<IAppConfig['active']>,
    menus: PAGES_MENU.profile
  },
  onLoad() {
    app.on('userChange',this.onEventUserChange)
  },
  onReady() {
    this.loadUserInfo()
  },
  onShow() {
    this.getTabBar().setData({selected: 2})
  },

  tapUser(){
    if(user.isActive) {
      return this.tapToEditInfo()
    }
    return this.showActiveNotice()
  },
  
  async tapToActiveAccount(){
    await loadData(user.activeAccount, {}, '正在激活账号')
    showSuccess("激活成功")
    this.reloadUserInfo()
    this.hideActiveNotice()
  },

  loadUserInfo(){
    const { nickName, avatarUrl, isActive, identifyCode } = user.baseInfo 
    this.setData({
      user: {
        nickName,
        avatarUrl,
        isActive,
        identifyCode
      }
    })
  },

  reloadUserInfo(){
    user.reloadInfo().then(()=>{
      this.loadUserInfo()
    })
  },

  tapToEditInfo(){
    if(!user.isActive) return
    navigateTo('./edit/index')
  },

  onEventUserChange(){
    console.log('onEventUserChange')
    this.reloadUserInfo()
  },

  tapToItem(e){
    const needActiveItemList = ['兔币明细','卡片标签','软件设置']
    const item = e.currentTarget.dataset.item
    if(needActiveItemList.includes(item.name)){
      return app.showActiveNotice()
    }
    return navigateTo(item.url || item)
  },

  tapToReadDoc(e){
    app.navToDoc(e.currentTarget.dataset.item.id)
  },

  async showActiveNotice(){
    await this.loadActiveData()
    this.setData({
      showActiveNotice: true
    })
  },

  hideActiveNotice(){
    this.setData({
      showActiveNotice: false
    })
  },
  
  async loadActiveData(){
    if(this.data.activeInfo.id) return
    const activeInfo = await loadData(api.getAppConfig, 'active')
    const doc = await loadData(api.getDoc, {_id: activeInfo.id})
    this.setData({
      activeInfo,
      'activeInfo.notice': doc.content
    })
  }
})