const globalData = getApp().globalData
import { loadData } from '@/utils/index'

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