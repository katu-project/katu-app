import { loadData } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const user = getUserManager()

Page({
  data: {
    masterKey: '',
    masterKeyRepeat: '',
    recoveryKey: ''
  },

  async tapToSelectQrcode(){
    const qrPack = await loadData(app.resetKeyManager.checkState)
    await app.showConfirm("重置凭证数据读取成功\n现在设置新密码？")
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
      app.showNotice('两次输入不一致')
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

    await app.showConfirm('确认使用该密码？')
    loadData(app.masterKeyManager.resetMasterKeyWithResetKey,{
      rk: this.data.recoveryKey,
      newKey: this.data.masterKey
    }).then(()=>{
      this.finishTask()
    })
  },

  async finishTask(){
    app.masterKeyManager.clear()
    user.reloadInfo()
    await app.showNotice(`主密码重置成功`)
    app.navigateBack()
  },
})