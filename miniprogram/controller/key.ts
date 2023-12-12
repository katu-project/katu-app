import Core from '@/class/core'
import { getCacheModule, getCryptoModule } from '@/module/index'
import { file } from '@/utils/index'
import { getUserManager } from './user'

class KeyManager extends Core {
  _masterKey: string = '' // app 主密码
  _userKey: string = '' // 用户原始密码

  get crypto(){
    return getCryptoModule()
  }
  
  get cache(){
    return getCacheModule()
  }

  get user(){
    return getUserManager()
  }

  get masterKey(){
    return this._masterKey
  }
}

class ResetKeyManager extends KeyManager {
  async create(masterKey:string){
    return this.crypto.createResetKey(masterKey)
  }

  save(keyPack){
    return this.api.setRecoveryKey(keyPack)
  }

  async fetchKeyFromResetKey(rk){
    if(!this.user.recoveryKeyPack) throw Error("没有设置备份主密码")
    return this.crypto.extractKeyFromResetKeyPack(this.user.recoveryKeyPack, rk)
  }

  async checkState(){
    const qrPack = await this.scanQrcode({
      onlyFromCamera: false
    })
    if(qrPack && qrPack.i !== this.user.recoveryKeyPack?.qrId){
      throw Error('重置凭证ID不匹配!')
    }
    return qrPack
  }
}

class MiniKeyManager extends KeyManager {
  async createMiniKey({miniKey, masterKey}:{miniKey:string, masterKey:string}){
    if(!miniKey) throw Error('快速密码不能为空')
    if(!masterKey) throw Error('读取主密码错误')
    const randomHexString = await this.crypto.randomHexString(12)
    const mixMiniKey = `${miniKey}${randomHexString}`
    const miniKeyPack = await this.crypto.createCommonKeyPack(mixMiniKey, masterKey)
    // 该数据存在本地    
    const miniKeySaveData = JSON.stringify({
      rk: randomHexString,
      keyPack: miniKeyPack
    })
    const keyId = await this.crypto.randomHexString(8)
    const miniKeySaveDataPath = await this.getMiniKeyPath(keyId)
    await file.writeFile(miniKeySaveDataPath, miniKeySaveData)
    return this.api.setUserMiniKeyInfo({
      configItem: 'useMiniKey',
      syncId: keyId,
      value: true
    })
  }

  async disable(){
    await this.cache.deleteMiniKey()
    return this.api.setUserMiniKeyInfo({
      configItem: 'useMiniKey',
      value: false
    })
  }

  async disableSync(){
    return this.api.setUserMiniKeyInfo({
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
    const miniKeyJsonString = await file.readFile<string>(miniKeyFilePath)
    const miniKeyEncryptPack = await this.crypto.encryptString(miniKeyJsonString, masterKey)
    return this.api.setUserMiniKeyInfo({
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

  setValue(key:string){
    this._masterKey = key
  }

  async create(key: string){
    const masterKeyPack = await this.crypto.createCommonKeyPack(key)
    return this.api.setMasterKeyInfo(masterKeyPack)
  }

  async update({key, newKey, originKey}:{key?:string, newKey, originKey?:string}){
    if(key && originKey) throw Error('内部错误')
    if(key){
      // 获取目前使用的主密码
      originKey = await this.crypto.fetchKeyFromKeyPack(this.user.masterKeyPack!, key)
    }
    // 重新生成新的主密码包, 更新时使用最新的 ccv
    const masterKeyPack = await this.crypto.createCommonKeyPack(newKey, originKey)
    // 更新主密码包
    return this.api.setMasterKeyInfo(masterKeyPack)
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
    if(this.user.useMiniKey && key.length === 6){
      const miniKeySaveDataPath = await this.getMiniKeyPath(this.user.miniKeyPack?.syncId!)
      let mixMiniKey, keyPack
      try {
        const keyPackJson = JSON.parse(await file.readFile<string>(miniKeySaveDataPath))
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

  checkMasterKey(){
    const error = {
      code: '',
      message: ''
    }
    if(!this.user.isSetMasterKey){
      error.code = '10'
      error.message = '还未设置主密码'
      throw error
    }

    if(!this.user.rememberPassword && !this.masterKey){
      error.code = '21'
      error.message = '请输入主密码'
      throw error
    }

    if(!this.masterKey) {
      error.code = '20'
      error.message = '请输入主密码'
      throw error
    }

    try {
      this.crypto.verifyKeyId(this.masterKey, this.user.masterKeyPack!)
    } catch (err) {
      error.code = '22'
      error.message = '主密码不匹配'
      throw error
    }

  }

  checkMasterKeyFormat(key:string){
    const clearKey = key.replace(/\s/g, '')
    if(!clearKey || clearKey.length < 6) throw Error("格式错误")
  }
}

function getMiniKeyManager(){
  return MiniKeyManager.getInstance<MiniKeyManager>()
}

function getMasterKeyManager(){
  return MasterKeyManager.getInstance<MasterKeyManager>()
}

function getResetKeyManager(){
  return ResetKeyManager.getInstance<ResetKeyManager>()
}

export {
    getMiniKeyManager,
    getMasterKeyManager,
    getResetKeyManager
}