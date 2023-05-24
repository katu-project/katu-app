import { loadData, navigateTo, showSuccess } from '@/utils/index'
import { DefaultUserAvatar, PAGES_MENU } from '@/const'
import api from '@/api'

import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const user = getUserManager()

Page({
  data: {
    user: {} as Partial<IUser>,
    activeInfo: {} as Partial<IUserConfig['active']>,
    menus: PAGES_MENU.profile,
    DefaultUserAvatar
  },
  onLoad() {
    app.on('userChange',this.onEventUserChange)
    this.loadUserInfo()
  },
  onReady() {
    
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
    this.setData({
      user: {
        nickName: user.nickName,
        avatarUrl: user.avatar,
        isActive: user.isActive,
        identifyCode: user.uid
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
    this.setData({
      'user.avatarUrl': DefaultUserAvatar
    })
    this.reloadUserInfo()
  },

  tapToItem(e){
    const needActiveItemList = ['兔币明细','卡片标签','软件设置']
    const item = e.currentTarget.dataset.item
    if(needActiveItemList.includes(item.name) && !user.isActive){
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
    const activeInfo = await loadData(api.getUserConfig, 'active')
    const doc = await loadData(api.getDoc, {_id: activeInfo.id})
    this.setData({
      activeInfo,
      'activeInfo.notice': doc.content
    })
  }
})