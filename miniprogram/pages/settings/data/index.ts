import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const user = getUserManager()

app.createPage({
  i18n: {
    page: ['settings','data']
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
    await app.showConfirm(`${this.t('confirm_export')}?`)
    await loadData(app.exportCardData)
    app.showNotice(this.t('submit_success'))
  },
  
  async tapToClearCacheData(){
    await app.showConfirm(`${this.t('confirm_clear')}?`)
    await loadData(app.clearCacheData)
    app.showNotice(this.t('delete_success'))
  },

  tapToPage(e){
    app.goToPage(e.currentTarget.dataset.page)
  }
})