const { showError, showSuccess, loadData, showChoose } = require('../../../../utils/index')
const globalData = getApp().globalData

Page({
  data: {
    setMasterKey: false,
    masterKey: '',
    masterKeyRepeat: '',
    newMasterKey: '',
    newMasterKeyRepeat: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
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
      this.updateMasterKey()
    }else{
      if(!this.data.masterKey || this.data.masterKey !== this.data.masterKeyRepeat){
        showError('两次输入不一致')
        return
      }
      this.setMasterKey()
    }
  },
  async updateMasterKey(){
    if(!globalData.app.user.setMasterKey){
      throw Error('请先设置主密码')
    }
    const params = {
      masterKey: this.data.masterKey,
      newMasterKey: this.data.newMasterKey
    }

    showChoose('确认使用该密码？').then(({cancel})=>{
      if(cancel) return
      loadData(globalData.app.updateUserMasterKey,params).then(()=>{
        this.finishTask()
      })
    })
  },
  async setMasterKey(){
    if(globalData.app.user.setMasterKey){
      showError('已经设置主密码')
      return
    }

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
    showChoose("设置成功","",{showCancel:false}).then(()=>{
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
  }
})