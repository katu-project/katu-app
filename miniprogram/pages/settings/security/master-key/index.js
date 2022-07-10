const { showError, loadData, showChoose, navigateTo } = require('../../../../utils/index')
const globalData = getApp().globalData

Page({
  data: {
    setMasterKey: false,
    masterKey: '',
    masterKeyRepeat: '',
    newMasterKey: '',
    newMasterKeyRepeat: ''
  },
  onLoad(options) {

  },
  onShow(){
    this.setData({
      setMasterKey: globalData.app.user.setMasterKey || false
    })
  },
  checkInput(){

  },
  checkRepeatInput(){

  },
  tapToSetMasterKey(){
    if(this.data.setMasterKey){
      if(!this.data.masterKey) {
        showError("输入当前主密码")
        return
      }
      if(!this.data.newMasterKey){
        showError('主密码不能为空')
        return
      }
      if(this.data.newMasterKey === this.data.masterKey){
        showError('相同密码')
        return
      }
      if(!this.data.newMasterKey || this.data.newMasterKey !== this.data.newMasterKeyRepeat){
        showError('两次输入不一致')
        return
      }
      
      try {
        this.updateMasterKey()
      } catch (error) {
        showError(error.message)
      }
    }else{
      if(!this.data.masterKey || this.data.masterKey !== this.data.masterKeyRepeat){
        showError('两次输入不一致')
        return
      }
      try {
        this.setMasterKey()
      } catch (error) {
        showError(error.message)
      }
    }
  },
  updateMasterKey(){
    if(!globalData.app.user.setMasterKey){
      throw Error('请先设置主密码')
    }
    const params = {
      key: this.data.masterKey,
      newKey: this.data.newMasterKey
    }

    globalData.app.checkMasterKeyFormat(this.data.newMasterKey)

    showChoose('确认使用该密码？').then(({cancel})=>{
      if(cancel) return
      loadData(globalData.app.updateUserMasterKey,params).then(()=>{
        this.finishTask()
      })
    })
  },
  setMasterKey(){
    if(globalData.app.user.setMasterKey){
      showError('已设置过主密码')
      return
    }

    globalData.app.checkMasterKeyFormat(this.data.masterKey)

    showChoose('确认使用该密码？').then(({cancel})=>{
      if(cancel) return
      loadData(globalData.app.setUserMasterKey,this.data.masterKey).then(()=>{
        this.finishTask()
      })
    })
  },
  finishTask(){
    globalData.app.clearMasterKey()
    globalData.app.reloadUserInfo()
    this.resetContent()
    showChoose(`${this.data.setMasterKey?'更新':'设置'}成功`,"",{showCancel:false}).then(()=>{
      wx.navigateBack()
    })
  },
  resetContent(){
    this.setData({
      masterKey: '',
      masterKeyRepeat: '',
      newMasterKey: '',
      newMasterKeyRepeat: ''
    })
  },
  tapToOpenDoc(){
    globalData.app.navToDoc('0a4ec1f9628b5501063149ac75a21cb7')
  }
})