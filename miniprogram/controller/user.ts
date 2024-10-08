import Controller from '@/class/controller'

export default class User extends Controller {
  _user: Partial<IUser> = {}
  _avatar: string = ''

  constructor(){
    super()
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
    return this.user.setMasterKey || false
  }

  get useMiniKey(){
    return this.user.config?.security.useMiniKey
  }

  get useSyncMiniKey(){
    return this.user.config?.security.useSyncMiniKey
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
    return this.user.config?.security.rememberPassword || false
  }
  
  async loadInfo(options?:{skipCache:boolean}){
    if(options?.skipCache){
      await this.cache.deleteUser()
    }
    let cacheUser = await this.cache.getUser() 
    if(!cacheUser || this.userInfoCacheTimeout(cacheUser.time)){
      const user = await this.invokeApi('getUser')
      console.debug(`用户数据缓存过期，重新获取: ${JSON.stringify(user).length} bytes`)
      cacheUser = { data:user, time:0 }
      await this.cache.setUser(user)
    }else{
      const cacheTime = new Date(cacheUser.time).toLocaleString()
      console.debug(`使用缓存的用户资料: ${JSON.stringify(cacheUser.data).length} bytes, 缓存时间: ${ cacheTime }`)
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
  }

  async checkQuota(){
    if(this.quota < 0){
      throw Error('兔币余额不足')
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
      await this.deleteLocalData('USER_INFO_CACHE_KEY')
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
    if(!this.storageConfig?.cos.enable) throw Error('未配置自定义存储')
    const cosJsonStr = this.crypto.decryptString(this.storageConfig?.cos.keyPack, masterKey)
    if(this.crypto.getStringHash(cosJsonStr, 'SHA1') !== this.storageConfig.cos.keyId) throw Error('提取配置出错')
    const cosJson = JSON.parse(cosJsonStr)
    return cosJson as ICustomStorageConfig
  }

  async setCustomStorage({cosConfig, masterKey}:{cosConfig:ICustomStorageConfig, masterKey:string}){
    const cosJsonString = JSON.stringify(cosConfig)
    const keyId = this.crypto.getStringHash(cosJsonString,'SHA1')
    const keyPack = await this.crypto.encryptString(cosJsonString, masterKey)
    
    // secret 字段脱敏处理
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
    await this.deleteLocalData('USER_INFO_CACHE_KEY')
  }

  async removeCustomStorage(){
    await this.invokeApi('updateCustomStorage', {
      config: {},
      action: 'delete'
    })
    await this.deleteLocalData('USER_INFO_CACHE_KEY')
  }

  async configCustomStorage(enable:boolean){
    await this.invokeApi('updateCustomStorage', {
      config: {
        enable 
      }
    })
    await this.deleteLocalData('USER_INFO_CACHE_KEY')
  }

  // 未使用
  async bindTelNumber(data){
    return this.invokeApi('bindTelNumber', data)
  }

  // 未使用
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
      throw Error("标签已存在")
    }

    if(this.config?.general.useDefaultTag && this.getCardConfig('defaultTags').find(tag=>tag.name === tagName)){
      throw Error("内置标签中已经存在\n无需重复创建")
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