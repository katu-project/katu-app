import { loadData } from "@/utils/index"
import { getUserManager } from '@/controller/user'
import { getAppManager } from "@/controller/app"
const user = getUserManager()
const app = getAppManager()

app.createPage({
  i18n: {
    page: ['settings','general']
  },

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
        text: this.t('go_detail'),
        action: app.openTagConflictDoc
      }
    }
    loadData(user.applyConfig,configItem,loadDataOptions).then(()=>{
      app.showMiniNotice(this.t('config_success'))
    }).catch(()=>{
      this.loadData()
    })
  },

  tapToPage({currentTarget:{dataset:{page}}}){
    app.goToPage(page)
  }
})