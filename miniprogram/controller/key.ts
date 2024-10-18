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
    if(!this.user.recoveryKeyPack) throw Error(this.t_e('no_key_backup'))
    return this.crypto.extractKeyFromResetKeyPack(this.user.recoveryKeyPack, rk)
  }

  async checkState(qrPack){
    if(!qrPack || !qrPack.i || qrPack.i !== this.user.recoveryKeyPack?.qrId){
      throw Error(this.t_e('backup_not_match'))
    }
  }
}

class MiniKeyManager extends KeyManager {
  async createMiniKey({miniKey, masterKey}:{miniKey:string, masterKey:string}){
    if(!miniKey) throw Error(this.t_e('mini_key_error'))
    if(!masterKey) throw Error(this.t_e('master_key_error'))
    const randomHexString = await this.crypto.randomHex(24)
    const mixMiniKey = `${miniKey}${randomHexString}`
    const miniKeyPack = await this.crypto.createCommonKeyPack(mixMiniKey, masterKey)
    // save local only  
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
    if(!masterKey) throw Error(this.t_e('master_key_error'))
    const miniKeyFilePath = await this.getMiniKeyPath(kid)
    try {
      await file.checkAccess(miniKeyFilePath)
    } catch (error:any) {
      throw Error(this.t_e('do_on_same_device'))
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
      throw Error(this.t_e('mini_key_not_sync'))
    }
    console.debug('mini key sync is good')
  }

  async sync(masterKey:string){
    if(!this.user.miniKeyPack?.syncId || !this.user.miniKeyPack?.pack){
      throw Error(this.t_e('mini_key_sync_first'))
    }
    const miniKeyPackJsonString = await this.crypto.decryptString(this.user.miniKeyPack.pack, masterKey)
    let miniKeyPack
    try {
      miniKeyPack = JSON.parse(miniKeyPackJsonString)
    } catch (_) {}
    if(!miniKeyPack || !miniKeyPack.rk || !miniKeyPack.keyPack){
      throw Error(this.t_e('mini_key_sync_error'))
    }
    const miniKeyFilePath = await this.getMiniKeyPath(this.user.miniKeyPack.syncId)
    await file.writeFile(miniKeyFilePath, miniKeyPackJsonString)
    console.debug('mini key sync ok')
  }
}

class MasterKeyManager extends KeyManager{
  _userKey: string = '' // user origin key
  _masterKey: string = '' // app master key

  get masterKey(){
    return this._masterKey
  }

  get originUserKey(){
    return this._userKey
  }

  setValue(key:string){
    this._masterKey = key
  }

  async create(key: string){
    if(!key) throw Error(this.t_e('no_new_key'))
    const masterKeyPack = await this.crypto.createCommonKeyPack(key)
    return this.invokeApi('setMasterKeyInfo', masterKeyPack)
  }

  async update({newKey, originKey}:{newKey:string, originKey?:string}){
    if(!newKey) throw Error(this.t_e('no_new_key'))
    if(!originKey){
      if(!this.masterKey) throw Error(this.t_e('no_key_find'))
      // use key in runtime
      originKey = this.masterKey
    }
    // re create new key pack, use latest new ccv
    const masterKeyPack = await this.crypto.createCommonKeyPack(newKey, originKey)
    return this.invokeApi('setMasterKeyInfo', masterKeyPack)
  }

  async load(){
    const masterKey = await this.cache.getMasterKey()
    if(masterKey){
      this.setValue(masterKey)
      console.log("load master key ok in local cache")
    }else{
      console.warn("no master key find in local cache")
    }
  }

  // fetch origin master key use user key
  async loadWithKey(key:string){
    if(!this.user.masterKeyPack?.keyPack) throw Error(this.t_e('not_set_key'))
    
    let masterKey = ''
    if(this.user.useMiniKey && key.length === this.getConst('MINI_KEY_LENGTH')){
      const miniKeySaveDataPath = await this.getMiniKeyPath(this.user.miniKeyPack?.syncId!)
      let mixMiniKey, keyPack
      try {
        const keyPackJson = JSON.parse(await file.readFile<string>(miniKeySaveDataPath, 'utf8'))
        mixMiniKey = `${key}${keyPackJson.rk}`
        keyPack = keyPackJson.keyPack
      } catch (error) {
        throw Error(this.t_e('use_master_replace_mini'))
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
      state.message = this.t_k('not_set_key')
      return state
    }

    if(!this.user.rememberPassword && !this.masterKey){
      state.code = '21'
      state.needKey = true
      state.message = this.t_k('enter_master_key')
      return state
    }

    if(!this.masterKey) {
      state.code = '20'
      state.needKey = true
      state.message = this.t_k('enter_master_key')
      return state
    }

    try {
      this.crypto.verifyKeyId(this.masterKey, this.user.masterKeyPack!)
    } catch (err) {
      state.code = '22'
      state.needKey = true
      state.message = this.t_k('bad_key')
      return state
    }

    return
  }

  checkMasterKeyFormat(key:string){
    const clearKey = key.replace(/\s/g, '')
    if(!clearKey || clearKey.length < 6) throw Error(this.t_e('format_error'))
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