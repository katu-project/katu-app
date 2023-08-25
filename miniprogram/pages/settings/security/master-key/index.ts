import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const user = getUserManager()

Page({
  oldKey: '',
  inputKey: '',
  data: {
    setMasterKey: false,
    step: 0,
    focus: false,
    backStep: false,
    showInputKey: false,
    inputKeyResult: ''
  },

  onLoad() {

  },

  onShow(){
    this.setData({
      setMasterKey: user.isSetMasterKey,
      step: 0
    })
  },

  checkInput(){

  },

  checkRepeatInput(){

  },

  async tapToSetMasterKey(){
    if(user.isSetMasterKey){  
      try {
        await this.updateMasterKey(this.oldKey, this.inputKey)
      } catch (error:any) {
        app.showNotice(error.message)
      }
    }else{
      try {
        await this.setMasterKey(this.inputKey)
      } catch (error:any) {
        app.showNotice(error.message)
      }
    }
  },

  async updateMasterKey(key, newKey){
    if(!user.isSetMasterKey){
      throw Error('请先设置主密码')
    }
    const params = { key, newKey }
    app.checkMasterKeyFormat(newKey)
    loadData(app.updateUserMasterKey,params).then(()=>{
      this.finishTask()
    })
  },

  async setMasterKey(key){
    if(user.isSetMasterKey){
      app.showNotice('已设置过主密码')
      return
    }
    app.checkMasterKeyFormat(key)
    loadData(app.setUserMasterKey,key).then(()=>{
      this.finishTask()
    })
  },

  async finishTask(){
    app.clearMasterKey()
    await app.showNotice(`主密码${user.isSetMasterKey?'更新':'设置'}成功`)
    user.reloadInfo()
    app.navigateBack()
  },

  tapToOpenDoc(){
    app.openMasterKeyNotice()
  },

  tapToResetKey(){
    app.goResetKeyPage()
  },

  tapToStartSetKey(){
    this.inputKey = ''
    if(user.isSetMasterKey && this.oldKey === ''){
      this.showInputKey()
      return
    }
    this.setData({
      step: 1,
      key: '',
      tips: '',
      back: false
    })
    this.getFocus()
  },

  tapToBackStep(){
    this.setData({
      backStep: true
    })
    this.tapToStartSetKey()
  },

  getFocus(){
    this.setData({ 
      focus: true 
    });
  },

  showTips(tips){
    this.setData({
      tips: ''
    })
    setTimeout(() => {
      this.setData({
        tips
      })
    }, 300);
  },

  checkKey(e){
    const key = e.detail.value
    if(key.length == 0){
      this.setData({
        key: ''
      })
      return
    }
    this.setData({
      key: key
    })
  },

  inputConfirm(){
    const key = this.data.key.trim()
    if(!key){
      this.showTips('输入有误！')
      return
    }

    if(key.length < 8 || key.match(/^\d{8,}$/)){
      this.showTips('密码不满足格式要求！')
      return
    }

    if(this.data.step === 1 && this.oldKey === key){
      this.showTips('新密码不能与被修改的主密码相同！')
      return
    }

    if(this.data.step === 2 && this.inputKey !== key){
      this.showTips('两次输入不一致！')
      return
    }
    if(this.data.step === 1){
      this.inputKey = key
    }
    this.setData({
      step: ++this.data.step,
      key: '',
      tips: ''
    })
  },

  inputKeyConfirm(e){
    const key = e.detail.value
    app.loadMasterKeyWithKey(key).then(()=>{
      this.hideInputKey()
      this.oldKey = key
      this.tapToStartSetKey()
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
  }
})