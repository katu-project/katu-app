import { loadData, navigateBack } from '@/utils/index'
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

  async tapToSetMasterKey(){
    if(this.data.setMasterKey){
      if(!this.data.masterKey) {
        app.showNotice("输入当前主密码")
        return
      }
      if(!this.data.newMasterKey){
        app.showNotice('新的主密码不能为空')
        return
      }
      if(this.data.newMasterKey === this.data.masterKey){
        app.showNotice('新的主密码不能与旧密码相同')
        return
      }
      if(!this.data.newMasterKey || this.data.newMasterKey !== this.data.newMasterKeyRepeat){
        app.showNotice('两次输入的密码不一致')
        return
      }
      
      try {
        await this.updateMasterKey()
      } catch (error:any) {
        app.showNotice(error.message)
      }
    }else{
      if(!this.data.masterKey || this.data.masterKey !== this.data.masterKeyRepeat){
        app.showNotice('两次输入的密码不一致')
        return
      }
      try {
        await this.setMasterKey()
      } catch (error:any) {
        app.showNotice(error.message)
      }
    }
  },

  async updateMasterKey(){
    if(!user.isSetMasterKey){
      throw Error('请先设置主密码')
    }
    const params = {
      key: this.data.masterKey,
      newKey: this.data.newMasterKey
    }

    app.checkMasterKeyFormat(this.data.newMasterKey)

    await app.showConfirm('确认使用该主密码？')
    loadData(app.updateUserMasterKey,params).then(()=>{
      this.finishTask()
    })
  },

  async setMasterKey(){
    if(user.isSetMasterKey){
      app.showNotice('已设置过主密码')
      return
    }

    app.checkMasterKeyFormat(this.data.masterKey)

    await app.showConfirm('确认使用该密码？')
    loadData(app.setUserMasterKey,this.data.masterKey).then(()=>{
      this.finishTask()
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