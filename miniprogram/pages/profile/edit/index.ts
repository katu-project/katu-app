import { loadData } from '@/utils/index'
import { getUserManager } from '@/controller/user'
import { getAppManager } from '@/controller/app'
const user = getUserManager()
const app = getAppManager()

app.createPage({
  i18n: {
    page: ['profileEdit']
  },

  originData: {} as {name:string, avatar:string},

  data: {
    avatar: user.getConst('DefaultUserAvatar'),
    name: ''
  },

  onReady() {
    const setData = {
      name: user.nickName
    }
    if(user.avatar){
      setData['avatar'] = user.avatar
    }
    this.setData(setData)
    this.originData = Object.assign({},this.data)
  },

  nameInput(e){
    const setData = {
      name: e.detail.value.trim()
    }
    if(setData.name !== this.originData.name){
      setData['dataChange'] = true
    }else{
      setData['dataChange'] = false
    }
    this.setData(setData)
  },

  onBindChooseAvatar(e){
    this.setData({
      avatar: e.detail.avatarUrl,
      dataChange: true
    })
  },
  
  // app only
  async tapToChooseAvatar(){
    const avatarUrl = await app.chooseLocalImage()
    if(!avatarUrl) return
    this.setData({
      avatar: avatarUrl,
      dataChange: true
    })
  },
  
  async tapToSaveUserInfo(){
    const nickName = this.data.name
    if(nickName === this.originData.name && this.data.avatar === this.originData.avatar) {
      app.showNotice(`${this.t('data_no_change')}!`)
      return
    }
    const userData = {}

    if(nickName !== this.originData.name){
      if(nickName.length>8){
        app.showNotice(`${this.t('max_length')}: 8`)
        return
      }
      userData['name'] = nickName
    }
    if(this.data.avatar !== this.originData.avatar){
      userData['avatar'] = await loadData(user.uploadAvatar, this.data.avatar, this.t('uploading_avatar'))
    }
    
    await loadData(user.updateProfile, userData, this.t('saving_data'))
    await user.reloadInfo()
    user.publishUserProfileChangeEvent()
    await app.showNotice(this.t('update_success'))
    app.navigateBack()
  }
})