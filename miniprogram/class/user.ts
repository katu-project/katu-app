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

  get user(){
    return this._user
  }

  async loadInfo(){
    this._user = await api.getUser()
  }

  async checkQuota(encrypted: boolean){
    const { canUseCardCount, canUseEncryptedCardCount } = await api.usageStatistic()
    if(encrypted && canUseEncryptedCardCount) return
    if(!encrypted && canUseCardCount) return
    throw Error('可使用卡片量不足')
  }

  async syncTag(tags: ICardTag[]){
    this.user.customTag = tags
  }

  async setUserMasterKey(masterKeyPack){
    return api.setMasterKeyInfo(masterKeyPack)
  }

  async updateMasterKey(masterKeyPack){
    // 更新主密码包
    return api.setMasterKeyInfo(masterKeyPack)
  }

  async reloadInfo(){
    return this.loadInfo()
  }

  async applyConfig(configItem:{key:string,value:string}){
    utils.objectSetValue(this.user, configItem.key, configItem.value)
    return await api.updateUserConfig(this.user.config)
  }

  async clearInfo(){
    await this.reloadInfo() // 获取默认用户数据
  }

  async uploadAvatar(filePath){
    const s = new Date().getTime()
    return api.uploadAvatar(filePath, `user/${this.user.openid}/avatar/${s}`)
  }
}


function getUserInstance(){
  return User.getInstance<User>()
}

export {
  getUserInstance
}