const { loadData, navigateTo } = require('../../../utils/index')
const globalData = getApp().globalData

Page({
  data: {
    cate: {},
    list: [],
    isLoading: true
  },
  onLoad(options) {
    this.cate = options.cate || ''
  },
  onReady() {
    const cateData = globalData.app.Config.qaDocType.find(e=>e.value === this.cate)
    this.setData({
      cate: cateData
    })
    this.loadData()
  },
  onShow() {
    // this.loadData()
  },
  loadData(){
    loadData(globalData.app.api.getCateDoc, this.cate).then(list=>{
      this.setData({list,isLoading: false})
    })
  },
  tapToDetail(e){
    navigateTo('../detail/index?id='+ e.currentTarget.dataset.key)
  },
  onShareAppMessage() {

  }
})