import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const user = getUserManager()

app.createPage({
  i18n: {
    page: ['settings','security','resetKey']
  },

  data: {
    masterKey: '',
    masterKeyRepeat: '',
    recoveryKey: ''
  },

  async tapToSelectQrcode(){
    const qrPack = await loadData(app.scanQrcode, {
      onlyFromCamera: false
    }, { timeout: -1 })
    await loadData(app.resetKeyManager.checkState, qrPack)
    await app.showConfirm(this.t('start_set_key'))
    this.setData({
      showInputKey: true,
      recoveryKey: qrPack.rk
    })
  },

  checkInput(){

  },

  checkRepeatInput(){

  },

  async tapToSetMasterKey(){
    if(!this.data.masterKey || this.data.masterKey !== this.data.masterKeyRepeat){
      app.showNotice(this.t('same_input_error'))
      return
    }
    try {
      await this.setMasterKey()
    } catch (error:any) {
      app.showNotice(error.message)
    }
  },

  async setMasterKey(){
    app.masterKeyManager.checkMasterKeyFormat(this.data.masterKey)

    await app.showConfirm(this.t('confirm_use_key'))
    loadData(async ()=>{
      const originMasterKey = await app.resetKeyManager.fetchKeyFromResetKey(this.data.recoveryKey)
      await app.masterKeyManager.update({
        originKey: originMasterKey,
        newKey: this.data.masterKey
      })
    }).then(()=>{
      this.finishTask()
    })
  },

  async finishTask(){
    app.masterKeyManager.clear()
    user.reloadInfo()
    await app.showNotice(this.t('reset_key_success'))
    app.navigateBack()
  },
})