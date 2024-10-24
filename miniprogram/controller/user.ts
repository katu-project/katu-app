import Controller from '@/class/controller'
import { getAppManager } from './app'

export default class User extends Controller {
  _user: Partial<IUser> = {}
  _avatar: string = ''

  constructor(){
    super()
  }

  get app(){
    return getAppManager()
  }

  get config(){
    return this.user.config
  }

  get isOk(){
    return this.user.isActive && this.user.status === 1
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

  get isActive():boolean{
    return !!this.user.isActive
  }

  get isSetMasterKey():boolean{
    return this.user.setMasterKey ?? false
  }

  get useMiniKey(){
    return this.user.config?.security.useMiniKey ?? false
  }

  get useSyncMiniKey(){
    return this.user.config?.security.useSyncMiniKey ?? false
  }

  get masterKeyPack(){
    return this.user.masterKeyPack
  }

  get miniKeyPack(){
    return this.user.miniKeyPack
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

  get tel(){
    return this.user.contact?.tel
  }

  get email(){
    return this.user.contact?.email
  }

  get storageConfig(){
    return this.user.config?.storage
  }

  get user(){
    return this._user
  }

  get rememberPassword(){
    return this.user.config?.security.rememberPassword ?? false
  }
  
  async loadInfo(options?:{skipCache:boolean}){
    if(options?.skipCache){
      await this.cache.deleteUser()
    }
    let cacheUser = await this.cache.getUser() 
    if(!cacheUser || this.userInfoCacheTimeout(cacheUser.time)){
      const user = await this.invokeApi('getUser')
      console.debug(`User info cache timeout, fetch again: ${JSON.stringify(user).length} bytes`)
      cacheUser = { data:user, time:0 }
      await this.cache.setUser(user)
    }else{
      const cacheTime = new Date(cacheUser.time).toLocaleString()
      console.debug(`Use user info in cache: ${JSON.stringify(cacheUser.data).length} bytes, Cache time: ${ cacheTime }`)
    }
    if(cacheUser.data.avatarUrl){
      this._avatar = await this.cache.setUserAvatar(cacheUser.data.avatarUrl)
    }
    this._user = cacheUser.data
  }

  async reloadInfo(){
    return this.loadInfo({
      skipCache: true
    })
  }

  async clearInfo(){
    this._user = {}
    await this.cache.deleteUser()
  }

  async checkQuota(){
    if(this.quota < 0){
      throw Error(this.t_e('no_quota'))
    }
  }

  async markDocRead(params){
    return this.invokeApi('markRead', params)
  }

  async getQuotaLog(params){
    return this.invokeApi('getUserQuotaLog', params)
  }

  async updateProfile(userInfo){
    return this.invokeApi('updateUserProfile', userInfo)
  }

  async getQuotaLogDetail(params){
    return this.invokeApi('getUserQuotaLogDetail', params)
  }

  async quotaExchange(data){
    return this.invokeApi('quotaExchange', data)
  }

  async applyConfig(configItem:{key:string,value:string|boolean}){
    try {
      await this.invokeApi('updateUserConfig', configItem)
      await this.cache.deleteUser()
      return this.objectSetValue(this.user, configItem.key, configItem.value)
    } catch (error:any) {
      console.warn('applyConfig:',error.message)
      await this.reloadInfo()
      throw error
    }
  }

  async updateQuota(transaction){
    return this.invokeApi('updateUserQuota', {
      type: 'quota',
      transaction
    })
  }

  async getCustomStorageConfig(masterKey){
    if(!this.storageConfig?.cos.enable) throw Error(this.t_e('not_set_cs'))
    const cosJsonStr = this.crypto.decryptString(this.storageConfig?.cos.keyPack, masterKey)
    if(this.crypto.getStringHash(cosJsonStr, 'SHA1') !== this.storageConfig.cos.keyId) throw Error(this.t_e('get_cs_error'))
    const cosJson = JSON.parse(cosJsonStr)
    return cosJson as ICustomStorageConfig
  }

  async setCustomStorage({cosConfig}:{cosConfig:ICustomStorageConfig}){
    const cosJsonString = JSON.stringify(cosConfig)
    const keyId = this.crypto.getStringHash(cosJsonString,'SHA1')
    const keyPack = await this.crypto.encryptString(cosJsonString, this.app.masterKeyManager.masterKey)
    
    // secret fields fill with ***
    Object.keys(cosConfig.secret).map((key)=>{
      cosConfig.secret[key] = '*'.repeat(10) + cosConfig.secret[key].slice(-4)
    })

    const savePack = Object.assign(cosConfig,{
      keyId,
      keyPack
    })
    await this.invokeApi('updateCustomStorage', {
      config: savePack
    })
    await this.cache.deleteUser()
  }

  async removeCustomStorage(){
    await this.invokeApi('updateCustomStorage', {
      config: {},
      action: 'delete'
    })
    await this.cache.deleteUser()
  }

  async configCustomStorage(enable:boolean){
    await this.invokeApi('updateCustomStorage', {
      config: {
        enable 
      }
    })
    await this.cache.deleteUser()
  }

  // not used
  async bindTelNumber(data){
    return this.invokeApi('bindTelNumber', data)
  }

  // not used
  async removeBindTelNumber(data){
    return this.invokeApi('removeBindTelNumber', data)
  }

  async getTags(){
    const tagsCache = await this.cache.getTags()
    if(tagsCache) return tagsCache

    const fetchRemoteTags = await this.invokeApi('getUserTag')
    await this.cache.setTags(fetchRemoteTags)
    return fetchRemoteTags
  }

  // ui action 
  // ui action end

  // simple api proxy
  async deleteTag(_id: string){
    return this.invokeApi('deleteTag', {_id})
  }

  async createTag(tagName:string){
    const customTags = await this.getTags()
    if(customTags.find(tag=>tag.name === tagName)){
      throw Error(this.t_e('tag_exist'))
    }

    if(this.config?.general.useDefaultTag && this.getCardConfig('defaultTags').find(tag=>tag.name === tagName)){
      throw Error(this.t_e('build_in_tag'))
    }

    return this.invokeApi('createTag', tagName)
  }

  async updateTag(tag: Pick<ICardTag,'color'|'_id'>){
    return this.invokeApi('updateTag', tag)
  }

  async activeAccount(_:any){
    return this.invokeApi('activeAccount')
  }

  async deleteAccount(){
    await this.invokeApi('removeAccount')
    return this.clearInfo()
  }

  // simple api proxy end
}

function getUserManager(){
  return User.getInstance<User>()
}

export {
  getUserManager
}