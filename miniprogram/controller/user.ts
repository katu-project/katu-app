import Controller from '@/class/controller'
import api from "@/api"

export default class User extends Controller {
  _user: Partial<IUser> = {}
  _avatar: string = ''
  _tags: ICardTag[] = []

  constructor(){
    super()
  }

  get config(){
    return this.user.config
  }

  get uid(){
    return this.user.identifyCode
  }

  get id(){
    return this.user._id
  }

  get quota(){
    return this.user.quota?.remain || 0
  }

  get tags(){
    return this.deepCloneObject(this._tags)
  }

  get isActive():boolean{
    return !!this.user.isActive
  }

  get ccv(){
    return this.user.masterKeyPack?.ccv || this.getConfig('crypto').defaultCommonCryptoVersion
  }

  get isSetMasterKey():boolean{
    return this.user.setMasterKey || false
  }

  get masterKeyPack(){
    return this.user.masterKeyPack
  }

  get recoveryKeyPack(){
    return this.user.recoveryKeyPack
  }

  get nickName(){
    return this.user.nickName
  }

  get avatar(){
    return this._avatar || this.user.avatarUrl
  }

  get openid(){
    return this.user.openid
  }

  get tel(){
    return this.user.contact?.tel
  }

  get email(){
    return this.user.contact?.email
  }

  get user(){
    return this._user
  }

  get rememberPassword(){
    return this.user.config?.security.rememberPassword || false
  }

  async init(){
    await this.loadInfo()
    wx.nextTick(()=>{
      setTimeout(() => {
        this.loadCustomTags()
      }, 3000);
    })
    this.loadOnAppHideConfig()
  }
  
  async loadInfo(){
    this._user = await api.getUser()
    await this.cacheAvatar()
  }

  async reloadInfo(){
    return this.loadInfo()
  }

  async clearInfo(){
    return this.reloadInfo() // 获取默认用户数据
  }

  async cacheAvatar(){
    // 缓存avatar
    if(!this._user.avatarUrl) return

    const cacheAvatarPath = await this.cache.getUserAvatar(this._user.avatarUrl)
    if(!cacheAvatarPath){
      await this.cache.setUserAvatar(this._user.avatarUrl)
    }
    this._avatar = cacheAvatarPath
  }

  async checkQuota(){
    if(this.quota < 0){
      throw Error('兔币余额不足')
    }
  }

  async markDocRead(params){
    return api.markRead(params)
  }

  async getQuotaLog(params){
    return api.getUserQuotaLog(params)
  }

  async updateProfile(userInfo){
    return api.updateUserProfile(userInfo)
  }

  async getQuotaLogDetail(params){
    return api.getUserQuotaLogDetail(params)
  }

  async quotaExchange(data){
    return api.quotaExchange(data)
  }

  async loadCustomTags(){
    this._tags = await api.getUserTag()
  }

  async applyConfig(configItem:{key:string,value:string}){
    try {
      await api.updateUserConfig(configItem)
      return this.objectSetValue(this.user, configItem.key, configItem.value)
    } catch (error:any) {
      console.warn('applyConfig:',error.message)
      await this.reloadInfo()
      throw error
    }
  }

  async bindTelNumber(data){
    return api.bindTelNumber(data)
  }

  async removeBindTelNumber(data){
    return api.removeBindTelNumber(data)
  }

  async getTags(){
    return api.getUserTag()
  }

  // ui action 
  // ui action end

  // simple api proxy
  async deleteTag(_id: string){
    return api.deleteTag({_id})
  }

  async createTag(tagName:string){
    if(this.tags.find(tag=>tag.name === tagName)){
      throw Error("标签已存在")
    }

    if(this.config?.general.useDefaultTag && this.getConfig('tags').find(tag=>tag.name === tagName)){
      throw Error("已存在于内置标签\n可直接使用无需重复创建")
    }

    return api.createTag(tagName)
  }

  async updateTag(tag: Pick<ICardTag,'color'|'_id'>){
    return api.updateTag(tag)
  }

  async activeAccount(){
    return api.activeAccount({})
  }

  // simple api proxy end

  loadOnAppHideConfig(){
    wx.onAppHide(res=>{
      const globalState = getApp().globalData.state
      console.log('onAppHide:', res, globalState);
          // 暂时解决图片预览引起的清除主密码的bug
      if(globalState.inPreviewPic){
        globalState.inPreviewPic = false
        return
      }else if(globalState.inChooseLocalImage){
        globalState.inChooseLocalImage = false
        return
      }else if(globalState.inShareData){
        globalState.inShareData = false
        return
      }

      if(this.rememberPassword){
        console.log('缓存主密码');
        this.emit('CacheMasterKey')
      }else{
        if(this.config?.security.lockOnExit){
          console.log('退出并清除主密码');
          this.emit('ClearMasterKey')
        }
      }
    })
  }

}


function getUserManager(){
  return User.getInstance<User>()
}

export {
  getUserManager
}