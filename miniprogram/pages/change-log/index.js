const { loadData } = require("../../utils/index")
const globalData = getApp().globalData

Page({
  data: {
    list: []
  },
  onLoad(options) {

  },
  onReady() {
    loadData(globalData.app.api.getChangeLog).then(list=>{
      this.setData({
        list: list.map(e=>{
          e.time = e.createTime.slice(0,10)
          return e
        })
      })
    })
  },
  onShow() {
    
  }
})