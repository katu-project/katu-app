import { loadData, navigateTo, showSuccess } from '@/utils/index'
import { DefaultUserAvatar } from '@/const'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const user = getUserManager()

Page({
  data: {
    user: {} as Partial<IUser>,
    activeInfo: {},
    menus: app.profileMenus,
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
    return this.showActiveInfo()
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
  }
})