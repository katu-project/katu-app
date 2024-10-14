import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
import { CreateKeyInput } from '@/behaviors/keyInput'

const app = getAppManager()
const user = getUserManager()

app.createPage({
  i18n: {
    page: ['settings','security','masterKey']
  },

  inputKey: '',

  data: {
    key: '',
    setMasterKey: false,
    step: 0,
    focus: false,
    backStep: false
  },

  behaviors: [
    CreateKeyInput({
      changeMode: false,
      inputMode: 'adv',
      title: '输入主密码：'
    })
  ],

  onLoad() {},

  onShow(){
    this.setData({
      setMasterKey: user.isSetMasterKey,
      step: 0
    })
    this.configKeyInput({
      showSubBtn: user.isSetMasterKey
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
    await app.showMiniNotice(`${user.isSetMasterKey?this.t('update_success'):this.t('config_success')}`)
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
        tips: (this.t(tips) || tips) + ' !'
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
      this.showTips('input_error')
      return
    }

    if(key.length < 8 || key.match(/^\d{8,}$/)){
      this.showTips('format_error')
      return
    }

    if(this.data.step === 1 && app.masterKeyManager.originUserKey === key){
      this.showTips('same_key_error')
      return
    }

    if(this.data.step === 2 && this.inputKey !== key){
      this.showTips('same_input_error')
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

  // 密码验证通过回调
  inputKeyConfirm(){
    this.tapToStartSetKey()
  }
})