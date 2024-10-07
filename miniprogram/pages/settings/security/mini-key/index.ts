import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
import { CreateKeyInput } from '@/behaviors/keyInput'

const app = getAppManager()
const user = getUserManager()

Page({
  inputKey: '',
  setStep: 0,
  useKeyFor: 'setKey',

  data: {
    useMiniKey: false,
    syncMiniKey: false
  },

  behaviors: [
    CreateKeyInput()
  ],

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
      syncMiniKey: user.useSyncMiniKey
    })
    this.setKeyInputChangeMode(false)
  },

  async tapToUseMiniKey(e){
    this.useKeyFor = 'setKey'
    const value = e.detail.value
    // 先取消switch样式
    this.setData({
      useMiniKey: this.data.useMiniKey,
    })

    const {cancel} = await app.showChoose(`${value?'开启':'取消'}快速密码功能?`)
    if(cancel) return

    if(value){
      const state = app.masterKeyManager.check()
      if(state){
        if(state.needKey){
          this.showKeyInput({
            inputMode: 'adv',
            tips: '验证主密码：'
          })
        }else{
          app.showNotice(state.message)
        }
        return
      }
      this.showSetMiniKeyStep(1)
    }else{
      await loadData(app.miniKeyManager.disable)
      await user.reloadInfo()
      this.loadData()
      app.showMiniNotice('取消成功')
    }
  },

  async tapToSetSync(e){
    this.useKeyFor = 'setSync'
    const value = e.detail.value
    // 先取消switch样式
    this.setData({
      syncMiniKey: this.data.syncMiniKey,
    })

    const {cancel} = await app.showChoose(`${value?'开启':'取消'}多端同步功能?`)
    if(cancel) return

    if(value){
      const state = app.masterKeyManager.check()
      if(state){
        if(state.needKey){
          this.showKeyInput({
            changeMode: true
          })
        }else{
          app.showNotice(state.message)
        }
        return
      }
      this.setSyncMiniKey()
    }else{
      await loadData(app.miniKeyManager.disableSync)
      app.showMiniNotice('取消成功')
      user.reloadInfo().then(this.loadData)
    }
  },

  async setSyncMiniKey(){
    if(!user.miniKeyPack?.syncId) {
      app.showNotice('请先启用快速密码')
      return
    }
    loadData(app.enableSyncMiniKey, {
      syncId: user.miniKeyPack?.syncId
    }).then(()=>{
      app.showMiniNotice('设置成功')
      user.reloadInfo().then(this.loadData)
    })
  },

  async createMiniKey(key){
    if(this.setStep === 1){
      if(!key.match(/^\d{6}$/)){
        this.showKeyInputTips('密码格式错误!')
        return
      }
      this.inputKey = key
      this.hideKeyInput()
      setTimeout(()=>{
        this.showSetMiniKeyStep(2)
      },300)
    }else if(this.setStep === 2){
      if(this.inputKey !== key){
        this.showKeyInputTips('两次输入不一致！')
        return
      }
      this.hideKeyInput()
      await loadData(app.createMiniKey,{
        miniKey: this.inputKey
      })
      app.showMiniNotice(`设置成功`)
      user.reloadInfo().then(this.loadData)
    }else{
      app.masterKeyManager.loadWithKey(key).then(()=>{
        this.inputKey = ''
        this.hideKeyInput()
        setTimeout(()=>{
          this.showSetMiniKeyStep(1)
        },500)
      }).catch(error=>{
        this.showKeyInputTips(error.message)
      })
    }
  },

  async showSetMiniKeyStep(step){
    this.setStep = step
    this.setData({
      key: '',
      inputKeyShowSubBtn: false,
    })
    this.showKeyInput({
      inputMode: 'mini',
      tips: step === 1 ? '设置快速密码' : '再次确认快速密码'
    })
  },

  inputKeyConfirm(e){
    const key = e.detail.value.trim()
    if(this.useKeyFor === 'setKey'){
      this.createMiniKey(key)
    }else if(this.useKeyFor === 'setSync'){
      app.masterKeyManager.loadWithKey(key).then(()=>{
        this.inputKey = ''
        this.hideKeyInput()
        this.setSyncMiniKey()
      }).catch(error=>{
        this.showKeyInputTips(error.message)
      })
    }else{
      app.showNotice('未知错误').then(app.navigateBack)
    }
  },

  tapToOpenDoc(){
    app.openMiniKeyNotice()
  }
})