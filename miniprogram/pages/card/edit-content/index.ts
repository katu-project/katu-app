const globalData = getApp().globalData
const { navigateBack } = globalData.utils

Page({
  data: {
    content: ''
  },
  onLoad(options) {
    this.returnContentKey = options.returnContentKey || 'tempData'
    if(options.value){
      this.setData({
        content: options.value
      })
    }
  },
  checkContent(){

  },
  tapToSetContent(){
    navigateBack({[this.returnContentKey]: this.data.content})
  }
})