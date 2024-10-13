import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const user = getUserManager()

app.createPage({
  i18n: {
    page: ['settings','storage']
  },

  data: {
    config_storage_cos: false
  },

  onLoad() {

  },

  onReady() {

  },

  onShow() {
    this.setData({
      config_storage_cos: user.config?.storage.cos.enable
    })
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
  },

  tapToPage(e){
    app.goToPage(e.currentTarget.dataset.page)
  }
})