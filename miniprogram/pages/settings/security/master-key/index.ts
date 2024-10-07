import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
import { CreateKeyInput } from '@/behaviors/keyInput'

const app = getAppManager()
const user = getUserManager()

Page({
  inputKey: '',

  data: {
    key: '',
    setMasterKey: false,
    step: 0,
    focus: false,
    backStep: false
  },

  behaviors: [
    CreateKeyInput()
  ],

  onLoad() {},

  onShow(){
    this.setData({
      setMasterKey: user.isSetMasterKey,
      step: 0
    })
  },

  checkInput(){},

  checkRepeatInput(){},

  async tapToSetMasterKey(){
    const updateMasterKey = async (newKey)=>{
      const params = { newKey }
      app.masterKeyManager.checkMasterKeyFormat(newKey)
      loadData(app.masterKeyManager.update, params).then(()=>{
        this.finishTask()
      })
    }
    const setMasterKey = async (key)=>{
      app.masterKeyManager.checkMasterKeyFormat(key)
      loadData(app.masterKeyManager.create, key).then(()=>{
        this.finishTask()
      })
    }
    try {
      if(user.isSetMasterKey){
        await updateMasterKey(this.inputKey)
      }else{
        await setMasterKey(this.inputKey)
      }
    } catch (error:any) {
      app.showNotice(error.message)
    }
  },

  async finishTask(){
    app.masterKeyManager.clear()
    await app.showMiniNotice(`${user.isSetMasterKey?'更新':'设置'}成功`)
    await user.reloadInfo()
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
    if(user.isSetMasterKey && app.masterKeyManager.masterKey === ''){
      this.showKeyInput()
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

    if(this.data.step === 1 && app.masterKeyManager.originUserKey === key){
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

  inputKeyConfirm(){
    this.tapToStartSetKey()
  }
})