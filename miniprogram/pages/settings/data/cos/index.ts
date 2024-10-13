import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
import { CreateKeyInput } from '@/behaviors/keyInput'

const app = getAppManager()
const user = getUserManager()

app.createPage({
  i18n: {
    page: ['settings','storage']
  },
  
  data: {
    typeList: app.storage.ServiceList,
    created: false,
    selectedType: '',
    cosConfig: {
      enable: false,
      type: '',
      bucket: '',
      region: '',
      secret: {}
    }
  },

  behaviors: [
    CreateKeyInput()
  ],

  onLoad() {

  },

  async onReady() {
    this.renderData()
  },

  onShow() {

  },

  async renderData(){
    this.setData({
      selectedType: '',
      created: false,
      cosConfig: app.storage.getDefaultConfig()
    })
    await user.loadInfo()
    const cos = user.config?.storage.cos
    if(!cos?.type) return
    const setConfig = JSON.parse(JSON.stringify(cos))
    delete setConfig.keyId
    delete setConfig.keyPack
    this.setData({
      created: cos.keyId ? true : false,
      selectedType: app.storage.ServiceTypeLabel[setConfig.type].label || '',
      cosConfig: setConfig
    })
  },

  async tapToSave(){
    const { cosConfig } = this.data
    if(
      Object.keys(cosConfig).some(e=>cosConfig[e]==='') ||
      Object.keys(cosConfig.secret).some(e=>cosConfig.secret[e]==='')
    ){
      app.showMiniNotice('请填写配置')
      return
    }

    const state = app.masterKeyManager.check()
    if(state){
      if(state.needKey){
        this.showKeyInput()
      }else{
        app.showNotice(`${state.message}`)
      }
      return
    }

    if(user.config?.storage?.cos?.enable){
      const userCos = user.config?.storage.cos
      if( userCos.type !== cosConfig.type ||
          userCos.bucket !== cosConfig.bucket ||
          userCos.region !== cosConfig.region){
            await app.showConfirm('修改已启用的配置会导致对应储存的卡片数据无法访问')
          }
    }

    await loadData(app.storage.connectTest, cosConfig, {
      loadingTitle: '连接测试',
      failedContent: '无法访问存储，请检查配置'
    })

    await loadData(user.setCustomStorage, {
      cosConfig
    })
    app.showMiniNotice('修改成功')
    this.renderData()
  },

  async tapToDelete(){
    await app.showConfirm('删除配置会导致已储存的卡片数据无法访问')
    await loadData(user.removeCustomStorage, undefined)
    app.showMiniNotice('修改成功')
    this.renderData()
  },

  typeChange(e){
    const item = this.data.typeList[e.detail.value]
    this.setData({
      selectedType: item.label,
      cosConfig: app.storage.getDefaultConfig(item.name)
    })
  },

  async enableChange(e){
    const enable = e.detail.value
    if(!this.data.created || this.data.cosConfig.type !== user.config?.storage.cos.type){
      this.setData({
        'cosConfig.enable': enable
      })
      return
    }

    const action = enable ? '启用' : '关闭'
    const { confirm } = await app.showChoose(`确认${action}自定义存储？`)
    if(confirm){
      await loadData(user.configCustomStorage, enable)
      app.showMiniNotice(`${action}成功`)
      this.renderData()
    }else{
      this.setData({
        'cosConfig.enable': !enable
      })
    }
  },

  onBindinput({currentTarget:{dataset: {key}}, detail: {value}}){
    const setData = {
      [`cosConfig.${key}`]: value
    }
    this.setData(setData)
  },

  // 密码验证通过回调
  inputKeyConfirm(){
    this.tapToSave()
  }
})