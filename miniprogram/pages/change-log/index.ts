import { loadData } from '@/utils/index'
import api from '@/api'

export {}

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
    loadData(api.getChangeLog).then(list=>{
      this.setData({
        list: list.map(e=>{
          e.time = e.createTime.slice(0,10)
          return e
        })
      })
    })
  }
})