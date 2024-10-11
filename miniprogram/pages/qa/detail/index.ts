import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { CreateI18nBehavior } from '@/behaviors/i18n'
const app = getAppManager()

Page({
  data: {
    id: '',
    doc: {
      title: '',
      content: '',
      updateTime: ''
    }
  },

  behaviors: [
    CreateI18nBehavior({
      page: 'help'
    })
  ],
  
  onLoad(options) {
    this.data.id = options.id || ''
  },

  onReady() {
    this.loadData()
  },

  onShow(){
  },

  loadData(){
    if(!this.data.id){
      app.showNotice('文档不存在').then(()=> app.navigateBack())
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
      title: '卡兔使用文档 - ' + this.data.doc.title
    }
  }
})