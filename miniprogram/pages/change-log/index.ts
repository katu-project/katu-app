import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { CreateI18nBehavior } from '@/behaviors/i18n'
const app = getAppManager()

Page({
  data: {
    list: [] as AnyObject[],
    webUrl: 'https://katucloud.com/change-log'
  },

  behaviors: [
    CreateI18nBehavior({
      page: 'changeLog'
    })
  ],

  onLoad() {

  },

  onReady() {
    
  },

  onShow() {
    this.loadData()
  },

  loadData(){
    loadData(app.getChangeLog).then(list=>{
      this.setData({
        list: list.map(e=>{
          e.time = e.updateTime.slice(0,10)
          return e
        })
      })
    })
  },

  tapToCopy(){
    app.copyText(this.data.webUrl)
  }
})