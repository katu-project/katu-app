const globalData = getApp().globalData
const { loadData } = globalData.utils

export {}

Page({
  data: {
    user: globalData.user

  },
  onLoad(options) {

  },
  onReady() {

  },
  onShow() {

  },
  tapToExportData(){
    loadData().then(()=>{
      globalData.app.exportCardData()
    })
  }
})