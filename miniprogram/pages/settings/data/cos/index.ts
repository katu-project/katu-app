import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const user = getUserManager()

Page({
  data: {
    typeList: [
      {
        label: '腾讯云',
        value: 'tencent.cos'
      }
    ],
    created: false,
    selectedType: '',
    cosConfig: {
      enable: false,
      type: '',
      bucket: '',
      region: '',
      secretId: '',
      secretKey: ''
    }
  },

  onLoad() {

  },

  async onReady() {
    this.renderData()
  },

  onShow() {

  },

  async renderData(){
    await user.loadInfo()
    const cos = user.config?.storage.cos
    if(!cos) return
    this.setData({
      created: cos.keyId ? true : false,
      selectedType: this.data.typeList.find(e=>e.value===cos.type)?.label,
      cosConfig: {
        enable: cos.enable,
        type: cos.type,
        bucket: cos.bucket,
        region: cos.region,
        secretId: cos.secretId,
        secretKey: cos.secretKey
      }
    })
  },

  async tapToSave(){
    const { cosConfig } = this.data
    if(Object.keys(cosConfig).some(e=>cosConfig[e]==='')){
      app.showMiniNotice('请填写配置')
      return
    }

    const state = app.masterKeyManager.check()
    if(state){
      if(state.needKey){
        this.showInputKey()
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

    await loadData(app.cosConnectTest,cosConfig,{
      loadingTitle: '尝试连接测试',
      failedContent: '连接自定义存储失败，请检查配置'
    })

    await loadData(user.setCustomStorage, {
      cosConfig,
      masterKey: app.masterKeyManager.masterKey
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
      'cosConfig.type': item.value
    })
  },

  async enableChange(e){
    const enable = e.detail.value
    if(!this.data.created){
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
    if(['bucket','region'].includes(key)){
      if(value !== user.config?.storage?.cos[key]){
        setData[`cosConfig.secretId`] = ''
        setData[`cosConfig.secretKey`] = ''
      }
    }
    this.setData(setData)
  },

  inputKeyConfirm(e){
    const key = e.detail.value
    app.masterKeyManager.loadWithKey(key).then(()=>{
      this.hideInputKey()
      this.tapToSave()
    }).catch(error=>{
      this.setData({
        inputKeyResult: error.message
      })
    })
  },

  showInputKey(){
    this.setData({
      showInputKey: true
    })
  },

  hideInputKey(){
    this.setData({
      showInputKey: false
    })
  },

  tapToForgetKey(){
    app.goResetKeyPage()
  }
})