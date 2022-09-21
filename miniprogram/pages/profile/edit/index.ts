import { loadData, showError, showSuccess, showNotice, navigateBack } from '@/utils/index'
import { getAppManager } from '@/class/app'
import api from '@/api'
const app = getAppManager()

export {}

Page({
  originData: {} as {name:string, url:string},
  data: {
    url: '/static/images/user.svg',
    name: ''
  },
  onLoad() {
  },
  onReady() {
    this.setData({
      url: app.user.avatarUrl,
      name: app.user.nickName
    })
    this.originData = Object.assign({},this.data)
  },
  onShow(){
  },
  nameInput(e){
    this.setData({
      name: e.detail.value
    })
  },
  onBindChooseAvatar(e){
    this.setData({
      url: e.detail.avatarUrl
    })
  },
  async tapToSaveUserInfo(){
    if(this.data.name == this.originData.name && this.data.url == this.originData.url) {
      showNotice('数据无变动!')
      return
    }
    if(this.data.name.length>8){
      showError("昵称长度有误")
      return 
    }
    const userData = {
      name: this.data.name,
      url: this.data.url
    }
    if(!this.data.url.startsWith('https') && !this.data.url.startsWith('cloud:')){
      const url = await loadData(app.uploadUserAvatar, this.data.url, '正在上传头像')
      userData.url = url
    }
    
    loadData(api.updateUserProfile, userData, '正在保存信息').then(()=>{
      app.reloadUserInfo().then(()=>{
        showSuccess('修改成功').then(()=>{
          setTimeout(()=>{
            navigateBack()
          },500)
        })
      })
    })
  }
})