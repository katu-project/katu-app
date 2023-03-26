import Base from "@/class/base"
import { bip39, crypto } from "@/utils/index"

const ConvertUserKeyError = '密码转化出错'
const CalculateKeyIdError = '获取密码ID出错'

class Crypto extends Base {
  _config = {} as IAppCryptoConfig
  constructor(){
    super()
  }

  async init(config){
    console.debug('使用加密配置:',config)
    this._config = config
  }

  get config(){
    return this._config
  }

  encryptString(text,key){
    return crypto.encryptString(text,key)
  }

  decryptString(ciphertext,key){
    console.log(ciphertext,key)
    return crypto.decryptString(ciphertext,key)
  }

  randomKey(){
    return this.randomHexString(this.config.masterKeyLength)
  }

  randomHexString(byteLength:number){
    return crypto.random(byteLength)
  }

  convertToHexString(key:string){
    const {method} = this.config.userKeyConvert
    try {
      if(!crypto[method] || typeof crypto[method] !== 'function') throw Error(ConvertUserKeyError)
      const hexCode:string = crypto[method].call(null,key)
      if(!hexCode) throw Error(ConvertUserKeyError)
      return hexCode
    } catch (error) {
      console.error(error)
      throw Error(ConvertUserKeyError)
    }
  }

  calculateKeyId(key:string){
    const {method} = this.config.calculateKeyId
    try {
      if(!crypto[method] || typeof crypto[method] !== 'function') throw Error(CalculateKeyIdError)
      const hexCode:string = crypto[method].call(null,key)
      if(!hexCode) throw Error(CalculateKeyIdError)
      return hexCode
    } catch (error) {
      console.error(error)
      throw Error(CalculateKeyIdError)
    }
  }

  verifyKeyId(key:string, keyId:string){
    if(this.calculateKeyId(key) !== keyId) throw Error("密码ID验证失败")
  }

  async createCommonKeyPack(dkey: string, key?: string){
    if(!key){
      key = await this.randomKey()
    }
    const keyPack = {
      keyPack: this.encryptString(key, dkey),
      hexKeyId: this.calculateKeyId(dkey),
      keyId: this.calculateKeyId(key)
    }
    return keyPack
  }

  async fetchKeyFromKeyPack(keyPack:string, dkey:string){
    const key = this.decryptString(keyPack, dkey)
    if(!key) throw Error("密码有误")
    return key
  }

  generateRecoveryKey(){
    const words = bip39.generateMnemonic()
    return bip39.mnemonicToEntropy(words)
  }

  async createRecoveryKeyContent(){
    const qrId = await this.randomHexString(2)
    return {
      id: qrId.toUpperCase(),
      time: new Date().toLocaleDateString(),
      rk: this.generateRecoveryKey()
    }
  }

  async createRecoveryKeyPack(rkContent, dkey){
    const keyPack: IRecoveryKeyPack = {
      qrId: rkContent.id,
      createTime: rkContent.time,
      keyId: this.calculateKeyId(rkContent.rk),
      pack: this.encryptString(dkey, rkContent.rk)
    }
    return keyPack
  }

  async createRecoveryKeyQrCodePack(rkContent){
    const qrPack = {
      i: rkContent.id,
      t: rkContent.time,
      rk: rkContent.rk
    }
    return qrPack
  }

  async createRecoveryKey(masterKey:string){
    const rkContent = await this.createRecoveryKeyContent()
    const keyPack = await this.createRecoveryKeyPack(rkContent, masterKey)
    const qrPack = await this.createRecoveryKeyQrCodePack(rkContent)
    return {
      keyPack,
      qrPack
    }
  }

  extractKeyFromRecoveryKeyPack(keyPack, rk){
    const masterKey = this.decryptString(keyPack.pack, rk)
    if(!masterKey) throw Error("密码有误")
    return masterKey
  }
}


function getCryptoModule(){
  return Crypto.getInstance<Crypto>()
}

export {
  getCryptoModule
}