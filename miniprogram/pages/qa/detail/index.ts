import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
const app = getAppManager()

Page({
  data: {
    doc: {
      title: '',
      content: '数据加载中',
      updateTime: ''
    }
  },

  onLoad(options) {
    this.id = options.id
  },

  onReady() {
    this.loadData()
  },

  onShow(){
  },

  loadData(){
    if(!this.id){
      app.showNotice('文档不存在').then(()=> app.navigateBack())
      return
    }
    
    loadData(app.getDoc,{_id:this.id}).then(doc=>{
      doc.updateTime = new Date(doc.updateTime).toLocaleDateString()
      doc.content = doc.content.replaceAll('<p></p>','<br/>')
      this.setData({doc})
    })
  },

  onShareAppMessage() {
    return {
      title: '卡兔使用文档 - ' + this.data.doc.title
    }
  }
})