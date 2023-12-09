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

  async generateRecoveryKey(){
    return this.crypto.createRecoveryKey(this.masterKey, this.user.ccv)
  }

  setRecoveryKey(keyPack){
    return this.api.setRecoveryKey(keyPack)
  }

  async checkResetCode(){
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
  async createMiniKey({miniKey}:{miniKey:string}){
    if(!this._userKey || !miniKey) throw Error('出错了！')
    const randomHexString = await this.crypto.randomHexString(12)
    const hexCode = this.crypto.convertToHexString(`${miniKey}${randomHexString}`, this.user.ccv)
    const masterKeyHexCode = this.crypto.convertToHexString(this._userKey, this.user.ccv)
    const miniKeyPack = await this.crypto.createCommonKeyPack(hexCode, masterKeyHexCode)
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

  async enableSync(kid:string){
    if(!this._userKey) throw Error('出错了！')
    const masterKeyHexCode = this.crypto.convertToHexString(this._userKey, this.user.ccv)
    const miniKeyFilePath = await this.getMiniKeyPath(kid)
    try {
      await file.checkAccess(miniKeyFilePath)
    } catch (error:any) {
      throw Error('创建和同步需要在相同客户端')
    }
    const miniKeyJsonString = await file.readFile<string>(miniKeyFilePath)
    const miniKeyEncryptPack = await this.crypto.encryptString(miniKeyJsonString, masterKeyHexCode)
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

  async sync(){
    if(!this.user.miniKeyPack?.syncId || !this.user.miniKeyPack?.pack){
      throw Error('无法同步快速密码')
    }
    const masterKeyHexCode = this.crypto.convertToHexString(this._userKey, this.user.ccv)
    const miniKeyPackJsonString = await this.crypto.decryptString(this.user.miniKeyPack.pack, masterKeyHexCode)
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
  async setUserMasterKey(key: string){
    const hexCode = this.crypto.convertToHexString(key, this.user.ccv)
    const masterKeyPack = await this.crypto.createCommonKeyPack(hexCode)
    return this.api.setMasterKeyInfo(masterKeyPack)
  }

  async updateUserMasterKey({key, newKey}){
    const hexCode = this.crypto.convertToHexString(key, this.user.ccv)
    const newHexCode = this.crypto.convertToHexString(newKey, this.user.ccv)
    if(!this.user.masterKeyPack?.keyPack) throw Error('未设置主密码')
    // 获取主密码
    const masterKey = await this.crypto.fetchKeyFromKeyPack(this.user.masterKeyPack.keyPack, hexCode)
    // 重新生成新的主密码包, 更新时使用最新的ccv
    const masterKeyPack = await this.crypto.createCommonKeyPack(newHexCode, masterKey)
    // 更新主密码包
    return this.api.setMasterKeyInfo(masterKeyPack)
  }

  async loadMasterKey(){
    const masterKey = await this.cache.getMasterKey()
    if(masterKey){
      this.setMasterKey(masterKey)
      console.log("本地缓存的主密码加载成功")
    }else{
      console.warn("未发现本地缓存的主密码")
    }
  }

  // 用户主密码导出原始主密码
  async loadMasterKeyWithKey(key:string){
    if(!this.user.masterKeyPack?.keyPack) throw Error('未设置主密码')
    
    let hexCode = ''
    if(this.user.useMiniKey && key.length === 6){
      const miniKeySaveDataPath = await this.getMiniKeyPath(this.user.miniKeyPack?.syncId!)
      let miniKeyHexCode, keyPack
      try {
        const keyPackJson = JSON.parse(await file.readFile<string>(miniKeySaveDataPath))
        miniKeyHexCode = this.crypto.convertToHexString(`${key}${keyPackJson.rk}`, this.user.ccv)
        keyPack = keyPackJson.keyPack
      } catch (error) {
        throw Error('快速密码不可用，请使用主密码!')
      }
      hexCode = await this.crypto.fetchKeyFromKeyPack(keyPack.keyPack, miniKeyHexCode)
    }else{
      this.checkMasterKeyFormat(key)
      hexCode = this.crypto.convertToHexString(key, this.user.ccv)
    }
    const masterKey = await this.crypto.fetchKeyFromKeyPack(this.user.masterKeyPack.keyPack, hexCode)
    this._userKey = key
    this.setMasterKey(masterKey)
  }

  setMasterKey(key:string){
    this._masterKey = key
  }

  async clearMasterKey(){
    this.setMasterKey('')
    return this.cache.deleteMasterKey()
  }

  async cacheMasterKey(){
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
      this.crypto.verifyKeyId(this.masterKey, this.user.masterKeyPack!, this.user.ccv)
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

  async resetMasterKeyWithRecoveryKey({rk, newKey}){
    this.checkMasterKeyFormat(newKey)
    if(!this.user.recoveryKeyPack) throw Error("没有设置备份主密码")
    const masterKey = this.crypto.extractKeyFromRecoveryKeyPack(this.user.recoveryKeyPack, rk)
    const newHexCode = this.crypto.convertToHexString(newKey, this.user.ccv)
    // 重新生成新的主密码包
    const masterKeyPack = await this.crypto.createCommonKeyPack(newHexCode, masterKey)
    // 更新主密码包
    return this.api.setMasterKeyInfo(masterKeyPack)
  }
}

function getKeyManager(){
  return KeyManager.getInstance<KeyManager>()
}

function getMiniKeyManager(){
  return MiniKeyManager.getInstance<MiniKeyManager>()
}

function getMasterKeyManager(){
  return MasterKeyManager.getInstance<MasterKeyManager>()
}

export {
    getKeyManager,
    getMiniKeyManager,
    getMasterKeyManager
}