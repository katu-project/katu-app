import Core from '@/class/core'
import { getCacheModule, getCryptoModule } from '@/module/index'
import { file } from '@/utils/index'
import { getUserManager } from './user'

class KeyManager extends Core {
  get crypto(){
    return getCryptoModule()
  }
  
  get cache(){
    return getCacheModule()
  }

  get user(){
    return getUserManager()
  }

}

class ResetKeyManager extends KeyManager {
  async create(masterKey:string){
    return this.crypto.createResetKey(masterKey)
  }

  save(keyPack){
    return this.invokeApi('setRecoveryKey', keyPack)
  }

  async fetchKeyFromResetKey(rk){
    if(!this.user.recoveryKeyPack) throw Error("没有设置备份主密码")
    return this.crypto.extractKeyFromResetKeyPack(this.user.recoveryKeyPack, rk)
  }

  async checkState(qrPack){
    if(!qrPack || qrPack.i !== this.user.recoveryKeyPack?.qrId){
      throw Error('凭证ID不匹配!')
    }
  }
}

class MiniKeyManager extends KeyManager {
  async createMiniKey({miniKey, masterKey}:{miniKey:string, masterKey:string}){
    if(!miniKey) throw Error('快速密码不能为空')
    if(!masterKey) throw Error('读取主密码错误')
    const randomHexString = await this.crypto.randomHex(24)
    const mixMiniKey = `${miniKey}${randomHexString}`
    const miniKeyPack = await this.crypto.createCommonKeyPack(mixMiniKey, masterKey)
    // 该数据存在本地    
    const miniKeySaveData = JSON.stringify({
      rk: randomHexString,
      keyPack: miniKeyPack
    })
    const keyId = await this.crypto.randomHex(16)
    const miniKeySaveDataPath = await this.getMiniKeyPath(keyId)
    await file.writeFile(miniKeySaveDataPath, miniKeySaveData)
    return this.invokeApi('setUserMiniKeyInfo', {
      configItem: 'useMiniKey',
      syncId: keyId,
      value: true
    })
  }

  async disable(){
    await this.cache.deleteMiniKey()
    return this.invokeApi('setUserMiniKeyInfo', {
      configItem: 'useMiniKey',
      value: false
    })
  }

  async disableSync(){
    return this.invokeApi('setUserMiniKeyInfo', {
      configItem: 'useSyncMiniKey',
      value: false
    })
  }

  async enableSync({kid,masterKey}:{kid:string, masterKey:string}){
    if(!masterKey) throw Error('读取主密码错误')
    const miniKeyFilePath = await this.getMiniKeyPath(kid)
    try {
      await file.checkAccess(miniKeyFilePath)
    } catch (error:any) {
      throw Error('创建和同步需要在相同客户端')
    }
    const miniKeyJsonString = await file.readFile<string>(miniKeyFilePath, 'utf8')
    const miniKeyEncryptPack = await this.crypto.encryptString(miniKeyJsonString, masterKey)
    return this.invokeApi('setUserMiniKeyInfo', {
      configItem: 'useSyncMiniKey',
      value: true,
      miniKeyPack: {
        syncId: kid,
        pack: miniKeyEncryptPack
      }
    })
  }

  async checkState(){
    if(!this.user.useMiniKey || !this.user.useSyncMiniKey) return
    if(!this.user.miniKeyPack?.syncId) return
    const miniKeyFilePath = await this.getMiniKeyPath(this.user.miniKeyPack.syncId)
    try {
      await file.checkAccess(miniKeyFilePath)
    } catch (error:any) {
      throw Error('快速密码未同步')
    }
    console.debug('快速密码同步正常')
  }

  async sync(masterKey:string){
    if(!this.user.miniKeyPack?.syncId || !this.user.miniKeyPack?.pack){
      throw Error('无法同步快速密码')
    }
    const miniKeyPackJsonString = await this.crypto.decryptString(this.user.miniKeyPack.pack, masterKey)
    let miniKeyPack
    try {
      miniKeyPack = JSON.parse(miniKeyPackJsonString)
    } catch (_) {}
    if(!miniKeyPack || !miniKeyPack.rk || !miniKeyPack.keyPack){
      throw Error('同步失败')
    }
    const miniKeyFilePath = await this.getMiniKeyPath(this.user.miniKeyPack.syncId)
    await file.writeFile(miniKeyFilePath, miniKeyPackJsonString)
    console.debug('快速密码同步成功')
  }
}

class MasterKeyManager extends KeyManager{
  _userKey: string = '' // 用户原始密码
  _masterKey: string = '' // app 主密码

  get masterKey(){
    return this._masterKey
  }

  setValue(key:string){
    this._masterKey = key
  }

  async create(key: string){
    const masterKeyPack = await this.crypto.createCommonKeyPack(key)
    return this.invokeApi('setMasterKeyInfo', masterKeyPack)
  }

  async update({key, newKey, originKey}:{key?:string, newKey:string, originKey?:string}){
    if(key && originKey) throw Error('内部错误')
    if(key){
      // 获取目前使用的主密码
      originKey = await this.crypto.fetchKeyFromKeyPack(this.user.masterKeyPack!, key)
    }
    // 重新生成新的主密码包, 更新时使用最新的 ccv
    const masterKeyPack = await this.crypto.createCommonKeyPack(newKey, originKey)
    // 更新主密码包
    return this.invokeApi('setMasterKeyInfo', masterKeyPack)
  }

  async load(){
    const masterKey = await this.cache.getMasterKey()
    if(masterKey){
      this.setValue(masterKey)
      console.log("本地缓存的主密码加载成功")
    }else{
      console.warn("未发现本地缓存的主密码")
    }
  }

  // 用户主密码导出原始主密码
  async loadWithKey(key:string){
    if(!this.user.masterKeyPack?.keyPack) throw Error('未设置主密码')
    
    let masterKey = ''
    if(this.user.useMiniKey && key.length === this.getConst('MINI_KEY_LENGTH')){
      const miniKeySaveDataPath = await this.getMiniKeyPath(this.user.miniKeyPack?.syncId!)
      let mixMiniKey, keyPack
      try {
        const keyPackJson = JSON.parse(await file.readFile<string>(miniKeySaveDataPath, 'utf8'))
        mixMiniKey = `${key}${keyPackJson.rk}`
        keyPack = keyPackJson.keyPack
      } catch (error) {
        throw Error('快速密码不可用，请使用主密码!')
      }
      masterKey = await this.crypto.fetchKeyFromKeyPack(keyPack, mixMiniKey)
    }else{
      this.checkMasterKeyFormat(key)
      masterKey = await this.crypto.fetchKeyFromKeyPack(this.user.masterKeyPack, key)
    }
    this._userKey = key
    this.setValue(masterKey)
  }

  async clear(){
    this.setValue('')
    return this.cache.deleteMasterKey()
  }

  async setCache(){
    if(!this.masterKey) return
    return this.cache.setMasterKey(this.masterKey)
  }

  check(){
    const state = {
      code: '',
      needKey: false,
      message: ''
    }
    if(!this.user.isSetMasterKey){
      state.code = '10'
      state.message = '还未设置主密码'
      return state
    }

    if(!this.user.rememberPassword && !this.masterKey){
      state.code = '21'
      state.needKey = true
      state.message = '请输入主密码'
      return state
    }

    if(!this.masterKey) {
      state.code = '20'
      state.needKey = true
      state.message = '请输入主密码'
      return state
    }

    try {
      this.crypto.verifyKeyId(this.masterKey, this.user.masterKeyPack!)
    } catch (err) {
      state.code = '22'
      state.needKey = true
      state.message = '密码错误'
      return state
    }

    return
  }

  checkMasterKeyFormat(key:string){
    const clearKey = key.replace(/\s/g, '')
    if(!clearKey || clearKey.length < 6) throw Error("格式错误")
  }
}

export function getMiniKeyManager(){
  return MiniKeyManager.getInstance<MiniKeyManager>()
}

export function getMasterKeyManager(){
  return MasterKeyManager.getInstance<MasterKeyManager>()
}

export function getResetKeyManager(){
  return ResetKeyManager.getInstance<ResetKeyManager>()
}