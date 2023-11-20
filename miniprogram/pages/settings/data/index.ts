import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
const app = getAppManager()

Page({
  data: {
  },

  onLoad() {

  },

  onReady() {

  },

  onShow() {

  },

  async tapToExportData(){
    await app.showConfirm('确认导出卡片数据？')
    await loadData(app.exportCardData)
    app.showNotice('数据导出请求提交成功')
  },
  
  async tapToClearCacheData(){
    await app.showConfirm('确认清空缓存数据？')
    await loadData(app.clearCacheData)
    app.showNotice('缓存数据删除成功')
  }
})