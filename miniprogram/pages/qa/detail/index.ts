import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
const app = getAppManager()

app.createPage({
  i18n: {
    page: ['profile','help']
  },

  data: {
    id: '',
    doc: {
      title: '',
      content: '',
      updateTime: ''
    },
    showShare: false
  },
  
  onLoad(options) {
    this.data.id = options.id || ''
  },

  onReady() {
    this.loadData()
    if(app.isMp){
      this.setData({
        showShare: true
      })
    }
  },

  onShow(){
  },

  loadData(){
    if(!this.data.id){
      app.showNotice(this.t('not_find')).then(()=> app.navigateBack())
      return
    }
    
    loadData(app.getDoc,{_id:this.data.id}).then(doc=>{
      doc.updateTime = new Date(doc.updateTime).toLocaleDateString()
      doc.content = doc.content.replaceAll('<p></p>','<br/>')
      this.setData({doc})
    })
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: `${this.t('app_help_doc')} - ${this.data.doc.title}`
    }
  }
})