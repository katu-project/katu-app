import { loadData, navigateTo, showSuccess, showNotice, showLoading } from '@/utils/index'
import { getAppManager } from '@/class/app'
import { PAGES_MENU } from '@/const'
import api from '@/api'
const app = getAppManager()

export {}

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
      user: app.user
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
    if(this.data.user.isActive) {
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
    app.reloadUserInfo().then(()=>{
      this.setData({
        user: app.user
      })
    })
  },

  tapToEditInfo(){
    if(!this.data.user.isActive) return
    navigateTo('./edit/index')
  },

  checkRefreshUserData(){
    if(app.user && (this.data.user.nickName !== app.user.nickName || this.data.user.avatarUrl !== app.user.avatarUrl)){
      this.setData({
        'user.avatarUrl': app.user.avatarUrl,
        'user.nickName': app.user.nickName,
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