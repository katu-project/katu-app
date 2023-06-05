import { loadData, navigateTo } from '@/utils/index'
import { getAppManager } from '@/controller/app'
const app = getAppManager()
const QaTypeCate = app.getConfig('qaDocType')

Page({
  data: {
    qaCate: [] as IAnyObject[],
    list: [] as IAnyObject[],
    isLoading: true
  },
  onLoad() {
    this.setData({
      qaCate: QaTypeCate
    })
  },
  onReady() {
    this.loadData()
  },
  onShow() {
    // this.loadData()
  },
  loadData(){
    loadData(app.getHotDoc).then(list=>{
      this.setData({
        list,
        isLoading: false
      })
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