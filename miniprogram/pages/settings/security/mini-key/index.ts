import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const user = getUserManager()

Page({
  masterKey: '',
  inputKey: '',
  setStep: 0,
  data: {
    useMiniKey: false,
    syncMiniKey: false,
    showInputKey: false,
    tips: '验证主密码：',
    inputKeyResult: '',
    inputMode: 'adv'
  },

  onLoad() {

  },

  onShow(){
    this.setStep = 0
    this.setData({
      useMiniKey: user.useMiniKey
    })
  },

  checkInput(){

  },

  checkRepeatInput(){

  },

  async tapToUseMiniKey(e){
    const value = e.detail.value
    if(value){
      this.setData({
        useMiniKey: false,
      })
      this.showMiniKeyInput(0)
    }else{
      const {cancel, confirm} = await app.showChoose('取消快速密码？')
      if(confirm){
        await loadData(user.applyConfig, {
          key: 'config_security_useMiniKey',
          value: false
        })
        await app.clearMiniKey()
        await app.showNotice('取消成功')
        this.setData({
          useMiniKey: false
        })
      }
      if(cancel){
        this.setData({
          useMiniKey: true
        })
      }
    }
  },

  async createMiniKey(){
    await loadData(async ()=>{
      await app.createMiniKey({
        masterKey: this.masterKey,
        miniKey: this.inputKey
      })
      await user.applyConfig({
        key: 'config_security_useMiniKey',
        value: true
      })
    })
    await app.showNotice(`快速密码设置成功`)
    user.reloadInfo()
    this.setData({
      useMiniKey: true
    })
  },

  async showMiniKeyInput(step){
    this.setStep = step
    this.setData({
      key: '',
      tips: step === 0 ? '验证主密码：' : step === 1 ? '设置快速密码' : '再次确认快速密码',
      inputMode: step === 0 ? 'adv' : 'mini',
      inputKeyShowSubBtn: step === 0,
    })
    this.showInputKey()
  },

  showTips(message){
    this.setData({
      inputKeyResult: message
    })
  },

  inputKeyConfirm(e){
    const key = e.detail.value.trim()
    if(this.setStep === 1){
      if(!key.match(/^\d{6}$/)){
        this.showTips('密码格式错误!')
        return
      }
      this.inputKey = key
      this.hideInputKey()
      setTimeout(()=>{
        this.showMiniKeyInput(2)
      },300)
    }else if(this.setStep === 2){
      if(this.inputKey !== key){
        this.showTips('两次输入不一致！')
        return
      }
      this.hideInputKey()
      this.createMiniKey()
    }else{
      app.loadMasterKeyWithKey(key).then(()=>{
        this.masterKey = key
        this.inputKey = ''
        this.hideInputKey()
        setTimeout(()=>{
          this.showMiniKeyInput(1)
        },500)
      }).catch(error=>{
        this.showTips(error.message)
      })
    }
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

  tapToOpenDoc(){
    app.openMiniKeyNotice()
  },

  tapToResetKey(){
    app.goResetKeyPage()
  },
})