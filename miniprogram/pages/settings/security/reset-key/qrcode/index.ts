import utils, { showError, showChoose, loadData } from '../../../../../utils/index'
const globalData = getApp().globalData

Page({
  data: {
    masterKey: '',
    masterKeyRepeat: ''
  },
  onLoad() {

  },
  onReady() {

  },
  onShow() {
    // console.log(utils,globalData.app);
  },
  async tapToSelectQrcode(){
    try {
      const scan_res = await wx.scanCode({
        onlyFromCamera: false,
        scanType: ['qrCode']
      })
      const recoveryKeyInfo = await globalData.app.extractRecoveryKeyFromQrcode(scan_res)
      console.log(recoveryKeyInfo);
      
      if(recoveryKeyInfo.i !== globalData.app.user.recoveryKeyPack.qrId){
        await showChoose("警告","重置凭证ID不匹配！",{showCancel: false})
      }else{
        const {cancel} = await showChoose("温馨提示","重置凭证数据读取成功，去设置新密码？")
        if(cancel) return
        this.setData({
          showInputKey: true,
          recoveryKey: recoveryKeyInfo.rk
        })
      }
    } catch (error) {
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
    } catch (error) {
      showError(error.message)
    }
  },
  setMasterKey(){
    globalData.app.checkMasterKeyFormat(this.data.masterKey)

    showChoose('温馨提示','确认使用该密码？').then(({cancel})=>{
      if(cancel) return
      loadData(globalData.app.resetMasterKeyWithRecoveryKey,{
        rk: this.data.recoveryKey,
        key: this.data.masterKey
      }).then(()=>{
        this.finishTask()
      })
    })
  },
  finishTask(){
    globalData.app.clearMasterKey()
    globalData.app.reloadUserInfo()
    showChoose(`主密码重置成功`,"",{showCancel:false}).then(()=>{
      wx.navigateBack()
    })
  },
})