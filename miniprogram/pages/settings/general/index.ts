import { loadData, showSuccess } from "@/utils/index"
import { getAppManager } from '@/class/app'
const app = getAppManager()
import api from '@/api'
export {}

Page({
  data: {
    config_general_defaultUseEncrytion: false,
    config_general_useDefaultTag: true
  },
  onShow(){
    const {config} = app.user
    this.setData({
      config_general_defaultUseEncrytion: config?.general.defaultUseEncrytion,
      config_general_useDefaultTag: config?.general.useDefaultTag
    })
  },
  tapToConfig(e){
    const configItem = {
      key: e.currentTarget.dataset.key,
      value: e.detail.value
    }
    loadData(api.updateUserConfig, configItem).then(()=>{
      showSuccess('修改成功')
      app.reloadUserConfig(configItem)
    })
  }
})