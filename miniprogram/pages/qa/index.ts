import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { CreateI18nBehavior } from '@/behaviors/i18n'
const app = getAppManager()
const QaTypeCate = app.menu.qa

Page({
  data: {
    qaCate: [] as typeof QaTypeCate,
    list: [] as AnyObject[],
    isLoading: true
  },

  behaviors: [
    CreateI18nBehavior({
      page: 'help'
    })
  ],

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