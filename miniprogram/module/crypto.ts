import Base from "@/class/base"
import { KATU_MARK, PACKAGE_TAIL_LENGTH } from "@/const"
import { bip39, convert, crypto, file } from "@/utils/index"

const ConvertUserKeyError = '密码转化出错'
const CalculateKeyIdError = '获取密码ID出错'

class Crypto extends Base {
  _config = {} as IAppCryptoConfig
  constructor(){
    super()
  }

  async init(config:IAppCryptoConfig){
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
    return crypto.decryptString(ciphertext,key)
  }

  encryptFile(fileData,key){
    return crypto.encryptFile(fileData,key)
  }

  decryptFile(fileData,key){
    return crypto.decryptFile(fileData,key)
  }

  async getImageHash(filePath){
    const fileHexData = await file.readFile(filePath, 'hex')
    const hashValue = crypto[this.config.image.hash].call(null,fileHexData)
    console.debug('getHash: ',filePath, hashValue)
    return hashValue
  }

  async getFileHash(filePath, hashType: HashType){
    const fileHexData = await file.readFile(filePath, 'hex')
    return crypto[hashType].call(null,fileHexData)
  }

  async encryptImage({keyPair:{key, salt}, imagePath, extraData, savePath}: IEncryptImageOptions){
    const imageHexData = await file.readFile(imagePath, 'hex')
    const extraDataPack = this.packExtraData(extraData)
    const flag = '00000000'
    
    const mixHexData = (imageHexData as string).concat(extraDataPack.data)
    const encryptedData = this.encryptFile(mixHexData, key)
    
    const encryptPackage = encryptedData.concat(salt)
                                        .concat(flag).concat(extraDataPack.lengthData)
                                        .concat(KATU_MARK)

    console.debug('encryptPackage:',encryptedData.length, encryptPackage.slice(-PACKAGE_TAIL_LENGTH), salt, key)

    await file.writeFile(savePath, encryptPackage, 'hex')
    return {
      imageSecretKey: salt,
      imagePath: savePath
    }
  }

  async decryptImage({imagePath, savePath, keyPair:{key}}:IDecryptImageOptions){
    const decryptedImage:{savePath: string, extraData: any[]} = {
      savePath,
      extraData: []
    }
    const encryptedHexData = await file.readFile(imagePath, 'hex')
    // 解密数据
    const metaData = encryptedHexData.slice(-PACKAGE_TAIL_LENGTH)
    const mixHexData = encryptedHexData.slice(0, -PACKAGE_TAIL_LENGTH)

    const decryptedData = this.decryptFile(mixHexData, key)
    if(!decryptedData) throw Error("解密错误")
    // 检测并解密附加数据
    const {data:extraData, dataLength: extraDataLength} = this.unpackExtraData(decryptedData, metaData)
    if(extraDataLength){
      decryptedImage.extraData = extraData
    }
    const imageData = extraDataLength?decryptedData.slice(0, -extraDataLength): decryptedData

    await file.writeFile(decryptedImage.savePath, imageData, 'hex')
    return decryptedImage
  }

  packExtraData(extraData){
    const retDataInfo = {
      data: '',
      lengthData: '00000000'
    }
    extraData = JSON.stringify(extraData)
    if(extraData !== '[]') {
      const hexStr = convert.string2hex(extraData)
      console.log('packData',hexStr, hexStr.length)
      retDataInfo.data = hexStr
      retDataInfo.lengthData = hexStr.length.toString().padStart(8,'0')
    }
    return retDataInfo
  }

  unpackExtraData(mixHexData, metaData){
    const retDataInfo:{dataLength:number, data:any[]} = {
      dataLength: 0,
      data: []
    }
    const extraDataLength = parseInt(metaData.slice(-24,-16))
    if(extraDataLength){
      retDataInfo.dataLength = extraDataLength
      try {
        retDataInfo.data = JSON.parse(convert.hex2string(mixHexData.slice(-extraDataLength)))
      } catch (error) {
        console.log('unpackExtraData err:',error)
        throw Error("附加数据读取出错")
        
      }
    }
    return retDataInfo
  }

  randomKey(){
    return this.randomHexString(this.config.masterKeyLength)
  }

  randomHexString(byteLength:number){
    return crypto.random(byteLength)
  }

  createCommonKeyPair(key:string, salt?:string){
    const options = { iterations: 5000 } as Pbkdf2Options
    if(salt){
      options.salt = salt
    }
    return crypto.pbkdf2(key,options)
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