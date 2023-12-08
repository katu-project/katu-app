import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const user = getUserManager()

Page({
  inputKey: '',
  setStep: 0,
  useKeyFor: 'setKey',
  data: {
    useMiniKey: false,
    syncMiniKey: false,
    showInputKey: false,
    changeMode: false,
    tips: '验证密码：',
    inputKeyResult: '',
    inputMode: 'mini'
  },

  onLoad() {

  },

  onShow(){
    this.loadData()
  },

  loadData(){
    this.setStep = 0
    this.useKeyFor = 'setKey'
    this.inputKey = ''
    this.setData({
      useMiniKey: user.useMiniKey,
      syncMiniKey: user.useSyncMiniKey,
      changeMode: false
    })
  },

  async tapToUseMiniKey(e){
    this.useKeyFor = 'setKey'
    const value = e.detail.value
    this.setData({
      useMiniKey: this.data.useMiniKey,
    })

    const {cancel} = await app.showChoose(`${value?'开启':'取消'}快速密码功能?`)
    if(cancel) return

    if(value){
      try {
        app.keyManager.checkMasterKey()
      } catch (error) {
        this.showInputKey({
          inputMode: 'adv'
        })
        return
      }
      this.showSetMiniKeyStep(1)
    }else{
      await loadData(app.miniKeyManager.closeMiniKey)
      app.showNotice('取消成功')
      user.reloadInfo().then(this.loadData)
    }
  },

  async tapToSetSync(e){
    this.useKeyFor = 'setSync'
    const value = e.detail.value
    this.setData({
      syncMiniKey: this.data.syncMiniKey,
    })

    const {cancel} = await app.showChoose(`${value?'开启':'取消'}多端同步功能?`)
    if(cancel) return

    if(value){
      try {
        app.keyManager.checkMasterKey()
      } catch (error) {
        this.showInputKey({
          changeMode: true
        })
        return
      }
      this.setSyncMiniKey()
    }else{
      await loadData(app.miniKeyManager.closeSyncMiniKey)
      app.showNotice('取消成功')
      user.reloadInfo().then(this.loadData)
    }
  },

  async setSyncMiniKey(){
    loadData(app.miniKeyManager.setSyncMiniKey, user.miniKeyPack?.syncId).then(()=>{
      app.showNotice('设置成功')
      user.reloadInfo().then(this.loadData)
    })
  },

  async createMiniKey(key){
    if(this.setStep === 1){
      if(!key.match(/^\d{6}$/)){
        this.showTips('密码格式错误!')
        return
      }
      this.inputKey = key
      this.hideInputKey()
      setTimeout(()=>{
        this.showSetMiniKeyStep(2)
      },300)
    }else if(this.setStep === 2){
      if(this.inputKey !== key){
        this.showTips('两次输入不一致！')
        return
      }
      this.hideInputKey()
      await loadData(app.miniKeyManager.createMiniKey,{
        miniKey: this.inputKey
      })
      app.showNotice(`快速密码设置成功`)
      user.reloadInfo().then(this.loadData)
    }else{
      app.keyManager.loadMasterKeyWithKey(key).then(()=>{
        this.inputKey = ''
        this.hideInputKey()
        setTimeout(()=>{
          this.showSetMiniKeyStep(1)
        },500)
      }).catch(error=>{
        this.showTips(error.message)
      })
    }
  },

  async showSetMiniKeyStep(step){
    this.setStep = step
    this.setData({
      key: '',
      tips: step === 1 ? '设置快速密码' : '再次确认快速密码',
      inputMode: 'mini',
      inputKeyShowSubBtn: false,
    })
    this.showInputKey()
  },

  inputKeyConfirm(e){
    const key = e.detail.value.trim()
    if(this.useKeyFor === 'setKey'){
      this.createMiniKey(key)
    }else if(this.useKeyFor === 'setSync'){
      app.keyManager.loadMasterKeyWithKey(key).then(()=>{
        this.inputKey = ''
        this.hideInputKey()
        this.setSyncMiniKey()
      }).catch(error=>{
        this.showTips(error.message)
      })
    }else{
      app.showNotice('未知错误').then(app.navigateBack)
    }
  },

  showTips(message){
    this.setData({
      inputKeyResult: message
    })
  },

  showInputKey(options){
    this.setData({
      showInputKey: true,
      ...options
    })
  },

  hideInputKey(){
    this.setData({
      showInputKey: false
    })
  },

  tapToOpenDoc(){
    app.openMiniKeyNotice()
  },

  tapToResetKey(){
    app.goResetKeyPage()
  },
})