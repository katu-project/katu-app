import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
const app = getAppManager()

Page({
  data: {
    list: [] as IChangeLog[]
  },
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
        }).sort((a,b)=> -a.version.localeCompare(b.version))
      })
    })
  }
})