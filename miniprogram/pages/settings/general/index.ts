import { loadData } from "@/utils/index"
import { getUserManager } from '@/controller/user'
import { getAppManager } from "@/controller/app"
const user = getUserManager()
const app = getAppManager()

Page({
  data: {
    config_general_useDefaultTag: true,
    config_general_autoShowContent: false
  },

  onShow(){
    this.loadData()
  },

  loadData(){
    const {config} = user
    this.setData({
      config_general_useDefaultTag: config?.general.useDefaultTag,
      config_general_autoShowContent: config?.general.autoShowContent
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
    if(configItem.key === 'config_general_useDefaultTag'){
      loadDataOptions['failedNoticeCancel'] = {
        text: '查看详情',
        action: app.openTagConflictDoc
      }
    }
    loadData(user.applyConfig,configItem,loadDataOptions).then(()=>{
      app.showMiniNotice('修改成功')
    }).catch(()=>{
      this.loadData()
    })
  },

  tapToPage({currentTarget:{dataset:{page}}}){
    app.goToPage(page)
  }
})