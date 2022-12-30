import { loadData, navigateTo, showSuccess, showNotice, showLoading } from '@/utils/index'
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
    usedCardCount: 0,
    usedEncryptedCardCount: 0,
    menus: PAGES_MENU.profile
  },
  onLoad() {
  },
  onReady() {
    this.setData({
      user: user.baseInfo
    })
  },
  onShow() {
    this.getTabBar().setData({selected: 2})
    this.checkRefreshUserData()
    this.loadCardUsageStatistic()
  },

  loadCardUsageStatistic(){
    api.usageStatistic().then(stats=>{
      this.setData({
        usedCardCount: stats.usedCardCount ||  0,
        usedEncryptedCardCount: stats.usedEncryptedCardCount || 0
      })
    })
  },

  tapUser(){
    if(user.isActive) {
      return this.tapToEditInfo()
    }
    return this.showActiveNotice()
  },
  
  async tapToActiveAccount(){
    showLoading('等待获取授权')
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: ({cloudID}) => {
        loadData(api.activeAccount, {cloudId: cloudID}).then(()=>{
          showSuccess("激活成功")
          this.reloadUserInfo()
          this.hideActiveNotice()
        })
      },
      fail: () => {
        showNotice('取消授权')
      }
    })
  },

  reloadUserInfo(){
    user.reloadInfo().then(()=>{
      this.setData({
        user: user.baseInfo
      })
    })
  },

  tapToEditInfo(){
    if(!user.isActive) return
    navigateTo('./edit/index')
  },

  checkRefreshUserData(){
    if(this.data.user.nickName !== user.baseInfo.nickName || this.data.user.avatarUrl !== user.baseInfo.avatarUrl){
      this.setData({
        'user.avatarUrl': user.baseInfo.avatarUrl,
        'user.nickName': user.baseInfo.nickName,
      })
    }
  },

  async tapToShowActiveTip(){
    await this.loadActiveData()
    if(this.data.activeInfo.tip){
      app.navToDoc(this.data.activeInfo.tip)
    }
  },

  tapToItem(e){
    const item = e.currentTarget.dataset.item
    navigateTo(item.url || item)
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