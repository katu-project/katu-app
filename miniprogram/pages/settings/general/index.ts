import { loadData } from "@/utils/index"
import { getUserManager } from '@/controller/user'
import { getAppManager } from "@/controller/app"
const user = getUserManager()
const app = getAppManager()

Page({
  data: {
    config_general_defaultUseEncrytion: false,
    config_general_useDefaultTag: true,
    config_general_autoShowContent: false
  },
  onShow(){
    this.loadData()
  },
  loadData(){
    const {config} = user
    this.setData({
      config_general_defaultUseEncrytion: config?.general.defaultUseEncrytion,
      config_general_useDefaultTag: config?.general.useDefaultTag,
      config_general_autoShowContent: config?.general.autoShowContent
    })
  },
  tapToConfig(e){
    const configItem = {
      key: e.currentTarget.dataset.key,
      value: e.detail.value
    }
    loadData(user.applyConfig,configItem,{returnFailed: true}).then(()=>{
      app.showNotice('修改成功')
    }).catch(async err=>{
      this.loadData()
      const { cancel } = await app.showChoose(err.message, {
        cancelText: '查看详情'
      })
      if(cancel){
        app.openTagConflictDoc()
      }
    })
  }
})