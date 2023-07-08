import { showError, loadData, navigateBack } from '@/utils/index'
import { getAppManager } from '@/controller/app'
import { getUserManager } from '@/controller/user'
const app = getAppManager()
const user = getUserManager()

Page({
  data: {
    setMasterKey: false,
    masterKey: '',
    masterKeyRepeat: '',
    newMasterKey: '',
    newMasterKeyRepeat: ''
  },

  onLoad() {

  },

  onShow(){
    this.setData({
      setMasterKey: user.isSetMasterKey
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
      } catch (error:any) {
        showError(error.message)
      }
    }else{
      if(!this.data.masterKey || this.data.masterKey !== this.data.masterKeyRepeat){
        showError('两次输入不一致')
        return
      }
      try {
        this.setMasterKey()
      } catch (error:any) {
        showError(error.message)
      }
    }
  },

  updateMasterKey(){
    if(!user.isSetMasterKey){
      throw Error('请先设置主密码')
    }
    const params = {
      key: this.data.masterKey,
      newKey: this.data.newMasterKey
    }

    app.checkMasterKeyFormat(this.data.newMasterKey)

    app.showConfirm('确认使用该密码？').then(()=>{
      loadData(app.updateUserMasterKey,params).then(()=>{
        this.finishTask()
      })
    })
  },

  setMasterKey(){
    if(user.isSetMasterKey){
      showError('已设置过主密码')
      return
    }

    app.checkMasterKeyFormat(this.data.masterKey)

    app.showConfirm('确认使用该密码？').then(()=>{
      loadData(app.setUserMasterKey,this.data.masterKey).then(()=>{
        this.finishTask()
      })
    })
  },

  finishTask(){
    app.clearMasterKey()
    user.reloadInfo()
    this.resetContent()
    app.showNotice(`主密码${this.data.setMasterKey?'更新':'设置'}成功`).then(()=>{
      navigateBack()
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
    app.openMasterKeyNotice()
  },

  tapToResetKey(){
    app.goResetKeyPage()
  }
})