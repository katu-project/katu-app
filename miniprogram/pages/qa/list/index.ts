import { loadData, navigateTo } from '@/utils/index'
import { getAppManager } from '@/controller/app'
const app = getAppManager()
import api from '@/api'

export {}

Page({
  cate: '',
  data: {
    cate: {},
    list: [] as IAnyObject[],
    isLoading: true
  },
  onLoad(options) {
    this.cate = options.cate || ''
  },
  onReady() {
    const cateData = app.Config.qaDocType.find(e=>e.value === this.cate)
    this.setData({
      cate: cateData
    })
    this.loadData()
  },
  onShow() {
    // this.loadData()
  },
  loadData(){
    loadData(api.getCateDoc, this.cate).then(list=>{
      this.setData({list,isLoading: false})
    })
  },
  tapToDetail(e){
    navigateTo('../detail/index?id='+ e.currentTarget.dataset.key)
  },
  onShareAppMessage() {

  }
})