import Base from "@/class/base"
import { crypto } from "@/utils/index"

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
}


function getCryptoModule(){
  return Crypto.getInstance<Crypto>()
}

export {
  getCryptoModule
}