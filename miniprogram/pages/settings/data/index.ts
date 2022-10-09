import { loadData } from '@/utils/index'
import { getAppManager } from '@/class/app'
const app = getAppManager()

export {}

Page({
  data: {
    user: app.user

  },
  onLoad() {

  },
  onReady() {

  },
  onShow() {

  },
  tapToExportData(){
    loadData().then(()=>{
      app.exportCardData()
    })
  }
})