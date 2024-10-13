import { loadData } from "@/utils/index"
import { getUserManager } from '@/controller/user'
import { getAppManager } from "@/controller/app"
const user = getUserManager()
const app = getAppManager()

app.createPage({
  i18n: {
    page: ['settings','ui']
  },

  data: {
    config_ui_homeMainBtnAnimation: false
  },

  onShow(){
    this.loadData()
  },

  loadData(){
    const { config } = user
    this.setData({
      config_ui_homeMainBtnAnimation: config?.ui?.homeMainBtnAnimation || false
    })
  },

  tapToConfig(e){
    const configItem = {
      key: e.currentTarget.dataset.key,
      value: e.detail.value
    }
    const loadDataOptions = {
      returnFailed: true
    }
    loadData(user.applyConfig,configItem,loadDataOptions).then(()=>{
      app.showMiniNotice('修改成功')
    }).catch(()=>{
      this.loadData()
    })
  }
})