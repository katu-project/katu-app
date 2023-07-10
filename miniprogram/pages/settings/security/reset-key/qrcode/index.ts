import { showError, loadData, navigateBack } from '@/utils/index'
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
    try {
      const scan_res = await wx.scanCode({
        onlyFromCamera: false,
        scanType: ['qrCode']
      })
      const qrPack = await app.extractQrPackFromQrcode(scan_res)
      console.log(qrPack);
      
      if(qrPack.i !== user.recoveryKeyPack?.qrId){
        await app.showNotice("重置凭证ID不匹配!")
      }else{
        await app.showConfirm("重置凭证数据读取成功\n现在设置新密码？")
        this.setData({
          showInputKey: true,
          recoveryKey: qrPack.rk
        })
      }
    } catch (error:any) {
      if(error && error.errMsg.includes('cancel')){
        showError('取消选择')
        return
      }
      showError(error.message || '未知错误')
    }
  },

  checkInput(){

  },

  checkRepeatInput(){

  },

  tapToSetMasterKey(){
    if(!this.data.masterKey || this.data.masterKey !== this.data.masterKeyRepeat){
      showError('两次输入不一致')
      return
    }
    try {
      this.setMasterKey()
    } catch (error:any) {
      showError(error.message)
    }
  },

  async setMasterKey(){
    app.checkMasterKeyFormat(this.data.masterKey)

    await app.showConfirm('确认使用该密码？')
    loadData(app.resetMasterKeyWithRecoveryKey,{
      rk: this.data.recoveryKey,
      newKey: this.data.masterKey
    }).then(()=>{
      this.finishTask()
    })
  },

  async finishTask(){
    app.clearMasterKey()
    user.reloadInfo()
    await app.showNotice(`主密码重置成功`)
    navigateBack()
  },
})