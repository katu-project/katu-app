import { loadData, showChoose, showSuccess } from '@/utils/index'
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
  },
  async tapToClearCacheData(){
    const {confirm} = await showChoose('温馨提示','确认清空缓存数据？')
    if(confirm){
      await loadData(app.clearCacheData)
      showSuccess('缓存数据删除成功')
    }
  }
})