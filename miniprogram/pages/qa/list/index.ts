import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { CreateI18nBehavior } from '@/behaviors/i18n'
const app = getAppManager()
const QaTypeCate = app.menu.qa

Page({
  cate: '',

  data: {
    cate: {} as AnyObject,
    list: [] as AnyObject[],
    isLoading: true
  },

  behaviors: [
    CreateI18nBehavior({
      page: 'help'
    })
  ],

  onLoad(options) {
    this.cate = options.cate || ''
  },

  onReady() {
    const cateData = QaTypeCate.find(e=>e.value === this.cate)
    this.setData({
      cate: cateData
    })
    this.loadData()
  },

  onShow() {
  },

  loadData(){
    loadData(app.getCateDoc, this.cate).then(list=>{
      this.setData({list,isLoading: false})
    })
  },

  tapToDetail(e){
    app.goDocDetailPage(e.currentTarget.dataset.key)
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: '卡兔使用文档-' + this.data.cate.name
    }
  }
})