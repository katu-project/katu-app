import { loadData, navigateTo } from '@/utils/index'
import { getAppManager } from '@/class/app'
const app = getAppManager()
import api from '@/api'

Page({
  data: {
    qaCate: [] as IAnyObject[],
    list: [] as IAnyObject[]
  },
  onLoad() {
    this.setData({
      qaCate: app.Config.qaDocType
    })
  },
  onReady() {
    this.loadData()
  },
  onShow() {
    // this.loadData()
  },
  loadData(){
    loadData(api.getHotDoc).then(list=>{
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