import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
const app = getAppManager()
const QaTypeCate = app.getConfig('qaDocType')

Page({
  data: {
    qaCate: [],
    list: [],
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
    app.goDocDetailPage(e.currentTarget.dataset.key)
  },

  tapToGoDocList(e){
    app.goDocListPage(e.currentTarget.dataset.key)
  },

  onShareAppMessage() {
    return {
      title: '卡兔使用文档'
    }
  }
})