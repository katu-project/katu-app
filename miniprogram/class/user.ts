import api from "@/api"
import utils from "@/utils/index"
import Base from "./base"

export default class User extends Base {
  _user: Partial<IUser> = {}

  constructor(){
    super()
  }

  async init(){
    return this.loadInfo()
  }

  get config(){
    return this.user.config
  }

  get tags(){
    return this.user.customTag
  }

  get isActive():boolean{
    return this.user.isActive!
  }

  get isSetMasterKey():boolean{
    return this.user.setMasterKey!
  }
  
  get baseInfo(){
    return this.user
  }

  get user(){
    return {
      ...this._user,
      get isDeactivated():boolean{
        return this.status === 0
      }
    }
  }

  async loadInfo(){
    this._user = await api.getUser()
  }

  async reloadInfo(){
    return this.loadInfo()
  }

  async clearInfo(){
    return this.reloadInfo() // 获取默认用户数据
  }

  async checkQuota(encrypted: boolean){
    const { canUseCardCount, canUseEncryptedCardCount } = await api.usageStatistic()
    if(encrypted && canUseEncryptedCardCount) return
    if(!encrypted && canUseCardCount) return
    throw Error('可使用卡片量不足')
  }

  async applyConfig(configItem:{key:string,value:string}){
    try {
      await api.updateUserConfig(configItem)
      return utils.objectSetValue(this.user, configItem.key, configItem.value)
    } catch (error) {
      console.warn('applyConfig:',error.message)
      await this.reloadInfo()
      throw new Error("修改失败")
    }
  }

  async syncTag(tags:ICardTag[]){
    try {
      await api.updateTag(tags)
      return utils.objectSetValue(this.user, 'customTag', tags)
    } catch (error) {
      console.warn('syncTag:',error.message)
      await this.reloadInfo()
      throw new Error("修改失败")
    }
  }

  async uploadAvatar(filePath){
    const s = new Date().getTime()
    return api.uploadAvatar(filePath, `user/${this.user.openid}/avatar/${s}`)
  }
}


function getUserManager(){
  return User.getInstance<User>()
}

export {
  getUserManager
}