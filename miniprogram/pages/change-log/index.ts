const globalData = getApp().globalData
const { loadData } = globalData.utils

Page({
  data: {
    list: []
  },
  onLoad(options) {

  },
  onReady() {
    
  },
  onShow() {
    this.loadData()
  },
  loadData(){
    loadData(globalData.app.api.getChangeLog).then(list=>{
      this.setData({
        list: list.map(e=>{
          e.time = e.createTime.slice(0,10)
          return e
        })
      })
    })
  }
})