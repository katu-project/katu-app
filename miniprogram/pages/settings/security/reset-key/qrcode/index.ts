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
      const file = await globalData.app.chooseFile()
      if(!file) return
      const recoveryKey = await globalData.app.extractRecoveryKeyFromQrcodePath(file)

      this.setData({
        showInputKey: true,
        recoveryKey
      })
    } catch (error) {
      showError(error.message)
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

    showChoose('确认使用该密码？').then(({cancel})=>{
      if(cancel) return
      loadData(globalData.app.resetMasterKeyWithRecoveryWords,{
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