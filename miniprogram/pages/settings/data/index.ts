import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
const app = getAppManager()

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
    await app.showConfirm('确认清空缓存数据？')
    await loadData(app.clearCacheData)
    app.showNotice('缓存数据删除成功')
  }
})