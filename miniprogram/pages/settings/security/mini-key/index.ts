import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
import { CreateKeyInput } from '@/behaviors/keyInput'

const app = getAppManager()
const user = getUserManager()

app.createPage({
  i18n: {
    page: ['settings','security','miniKey']
  },

  inputKey: '',
  setStep: 0,
  useKeyFor: 'setKey',

  data: {
    useMiniKey: false,
    syncMiniKey: false
  },

  behaviors: [
    CreateKeyInput({
      changeMode: false,
      customKeyInputConfirm: true
    })
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
  },

  async tapToUseMiniKey(e){
    this.useKeyFor = 'setKey'
    const value = e.detail.value
    this.setData({
      useMiniKey: this.data.useMiniKey,
    })

    const {cancel} = await app.showChoose(`${value?this.t('enable_mini_key'):this.t('cancel_mini_key')}?`)
    if(cancel) return

    if(value){
      const state = app.masterKeyManager.check()
      if(state){
        if(state.needKey){
          this.showKeyInput({
            inputMode: 'adv',
            title: `${this.t('enter_master_key')}：`
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
      app.showMiniNotice(this.t('cancel_success'))
    }
  },

  async tapToSetSync(e){
    this.useKeyFor = 'setSync'
    const value = e.detail.value
    this.setData({
      syncMiniKey: this.data.syncMiniKey,
    })

    const {cancel} = await app.showChoose(`${value?this.t('enable_mini_key_sync'):this.t('cancel_mini_key_sync')}?`)
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
      app.showMiniNotice(this.t('cancel_success'))
      user.reloadInfo().then(this.loadData)
    }
  },

  async setSyncMiniKey(){
    if(!user.miniKeyPack?.syncId) {
      app.showNotice(this.t('enable_mini_key_first'))
      return
    }
    loadData(app.enableSyncMiniKey, {
      syncId: user.miniKeyPack?.syncId
    }).then(()=>{
      app.showMiniNotice(this.t('config_success'))
      user.reloadInfo().then(this.loadData)
    })
  },

  async createMiniKey(key){
    if(this.setStep === 1){
      if(!key.match(/^\d{6}$/)){
        this.configKeyInput({
          resultText: this.t('format_error') + '!'
        })
        return
      }
      this.inputKey = key
      this.hideKeyInput()
      setTimeout(()=>{
        this.showSetMiniKeyStep(2)
      },300)
    }else if(this.setStep === 2){
      if(this.inputKey !== key){
        this.configKeyInput({
          resultText: this.t('same_input_error') + '!'
        })
        return
      }
      this.hideKeyInput()
      await loadData(app.createMiniKey,{
        miniKey: this.inputKey
      })
      app.showMiniNotice(this.t('config_success'))
      user.reloadInfo().then(this.loadData)
    }else{
      app.masterKeyManager.loadWithKey(key).then(()=>{
        this.inputKey = ''
        this.hideKeyInput()
        setTimeout(()=>{
          this.showSetMiniKeyStep(1)
        },500)
      }).catch(error=>{
        this.configKeyInput({
          resultText: error.message
        })
      })
    }
  },

  async showSetMiniKeyStep(step){
    this.setStep = step
    this.setData({
      key: ''
    })
    this.showKeyInput({
      inputMode: 'mini',
      showSubBtn: false,
      title: step === 1 ? this.t('set_mini_key') : this.t('set_mini_key_again')
    })
  },

  // callback when key virify
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
        this.configKeyInput({
          resultText: error.message
        })
      })
    }else{
      app.showNotice(this.t('unknown_error')).then(app.navigateBack)
    }
  },

  tapToOpenDoc(){
    app.openMiniKeyNotice()
  }
})