const { loadData, navigateTo } = require('../../utils/index')
const globalData = getApp().globalData

Page({
  data: {
    qaCate: [],
    list: []
  },
  onLoad(options) {
    this.setData({
      qaCate: globalData.app.Config.qaDocType
    })
  },
  onReady() {
    this.loadData()
  },
  onShow() {
    // this.loadData()
  },
  loadData(){
    loadData(globalData.app.api.getHotDoc).then(list=>{
      this.setData({list})
    })
  },
  tapToDetail(e){
    navigateTo('./detail/index?id='+ e.currentTarget.dataset.key)
  },
  tapToGoDocList(e){
    navigateTo('./list/index?cate='+ e.currentTarget.dataset.key)
  },
  onShareAppMessage() {

  }
})