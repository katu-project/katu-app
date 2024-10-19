import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
const app = getAppManager()
const QaTypeCate = app.menu.qa

app.createPage({
  i18n: {
    page: ['profile','help']
  },

  cate: '',

  data: {
    cate: {} as AnyObject,
    list: [] as AnyObject[]
  },

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
      this.setData({
        list
      })
    })
  },

  tapToDetail(e){
    app.goDocDetailPage(e.currentTarget.dataset.key)
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: `${this.t('app_help_doc')} - ${this.data.cate.name}`
    }
  }
})