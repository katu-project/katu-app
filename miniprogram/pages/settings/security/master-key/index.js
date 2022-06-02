const { showError, showSuccess, loadData } = require('../../../../utils/index')
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
      setMasterKey: globalData.app.user.setMasterKey
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
    const appManager = globalData.app
    if(!appManager.user.setMasterKey){
      throw Error('请先设置主密码')
    }
    const params = {
      masterKey: this.data.masterKey,
      newMasterKey: this.data.newMasterKey
    }

    loadData(appManager.updateUserMasterKey,params).then(()=>{
      appManager.reloadUserInfo()
      appManager.clearMasterKey()
      this.resetContent()
      showSuccess('修改成功')
    })
  },
  async setMasterKey(){
    const appManager = globalData.app
    if(appManager.user.setMasterKey){
      showError('已经设置主密码')
      return
    }

    loadData(appManager.setUserMasterKey,this.data.masterKey).then(()=>{
      appManager.setMasterKey(masterKey)
      appManager.reloadUserInfo()
      appManager.clearMasterKey()
      this.resetContent()
      showSuccess('修改成功')
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