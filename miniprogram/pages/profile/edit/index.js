const { loadData, navigateTo, showSuccess, showNotice, navigateBack } = require('../../../utils/index')
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
  tapToSaveUserInfo(){
    loadData(globalData.app.api.updateUserProfile, this.data).then(()=>{
      globalData.app.reloadUserInfo()
      showSuccess('修改成功').then(()=>{
        setTimeout(()=>{
          navigateBack()
        },500)
      })
    })
  }
})