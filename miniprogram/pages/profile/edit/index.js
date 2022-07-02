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

  },
  onShow(){
    this.setData({
      url: globalData.app.user.avatarUrl,
      name: globalData.app.user.nickName
    })
  },
  emptyInput(){

  },
  onBindChooseAvatar(e){

  },
  tapToSaveUserInfo(){
    navigateBack()
  }
})