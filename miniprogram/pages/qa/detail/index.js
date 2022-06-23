const { loadData, showChoose } = require('../../../utils/index')
const globalData = getApp().globalData

Page({

  /**
   * 页面的初始数据
   */
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
    // this.loadData()
  },
  loadData(){
    if(!this.id){
      showChoose('该文档不存在').then(wx.navigateBack)
      return
    }
    loadData(globalData.app.api.getDoc,{_id:this.id}).then(doc=>{
      doc.updateTime = new Date(doc.updateTime).toLocaleDateString()
      doc.content = doc.content.replaceAll('<p></p>','<br/>')
      this.setData({doc})
    })
  },
  onShareAppMessage() {
    return {
      title: '卡兔使用帮助文档 - '+this.data.doc.title
    }
  }
})