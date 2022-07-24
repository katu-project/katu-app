const { loadData, showSuccess } = require("../../../utils/index")
const globalData = getApp().globalData

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