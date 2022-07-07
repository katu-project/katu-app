const { loadData, showError, showSuccess, showNotice, navigateBack } = require('../../../utils/index')
const globalData = getApp().globalData

Page({
  data: {
    url: '/static/images/user.svg',
    name: ''
  },
  onLoad(options) {
  },
  onReady() {
    this.setData({
      url: globalData.app.user.avatarUrl,
      name: globalData.app.user.nickName
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
    console.log(e.detail.avatarUrl);
    this.setData({
      url: e.detail.avatarUrl
    })
  },
  async tapToSaveUserInfo(){
    if(this.data.name == this.originData.name && this.data.url == this.originData.url) {
      showNotice('数据无变动!')
      return
    }
    if(this.data.name.length>6){
      return showError("昵称长度有误")
    }
    const userData = {
      name: this.data.name
    }
    if(!this.data.url.startsWith('https') && !this.data.url.startsWith('cloud:')){
      const url = await loadData(globalData.app.uploadUserAvatar, this.data.url, '正在上传头像')
      userData.url = url
    }
    
    loadData(globalData.app.api.updateUserProfile, userData, '正在保存信息').then(()=>{
      globalData.app.reloadUserInfo().then(()=>{
        showSuccess('修改成功').then(()=>{
          setTimeout(()=>{
            navigateBack()
          },500)
        })
      })
    })
  }
})