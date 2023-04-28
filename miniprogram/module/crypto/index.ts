import Base from "@/class/base"
import { getCpk, getCpkFromFile } from "./pkv/index"
import { bip39, convert, crypto, file } from "@/utils/index"

const ConvertUserKeyError = '密码转化出错'
const CalculateKeyIdError = '获取密码ID出错'
const KatuCryptoFormatter = {
  stringify: function(cipherParams) {
    const KatuMark = [0x9527,0x4396]
    const SaltMark = [0x53616c74, 0x65645f5f]
    const salt = cipherParams.salt
    const ciphertext = cipherParams.ciphertext
    
    const wordArray = crypto.createWordArray(KatuMark)
                      .concat(crypto.createWordArray(SaltMark))
                      .concat(salt)
                      .concat(ciphertext)
    return wordArray.toString(crypto.HexCoding)
  },
  parse: function(encryptedHexString) {
      const KatuMark = [0x9527,0x4396]
      const SaltMark = [0x53616c74, 0x65645f5f]

      const ciphertext = crypto.HexCoding.parse(encryptedHexString)
      const ciphertextWords = ciphertext.words
      if(ciphertextWords[0] !== KatuMark[0] || ciphertextWords[1] !== KatuMark[1]){
          throw Error("ciphertext format error")
      }
      
      // 移除卡兔标志
      ciphertextWords.splice(0,2)
      ciphertext.sigBytes -= 8

      let salt
      if (ciphertextWords[0] == SaltMark[0] && ciphertextWords[1] == SaltMark[1]) {
          // Extract salt
          salt = crypto.createWordArray(ciphertextWords.slice(2, 4));

          // Remove salt from ciphertext
          ciphertextWords.splice(0, 4);
          ciphertext.sigBytes -= 16;
      }

      return crypto.createCipherParams({
          ciphertext,
          salt
      })
  }
}

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

  encryptFile(fileData:string, key:string, options?:any){
    if(options){
      console.debug('encryptFile use config: ', options)
    }
    return crypto.AES.encrypt(fileData, key, {
      format: KatuCryptoFormatter
    }).toString()
  }

  decryptFile(fileData:string, key:string, options?:any){
    if(options){
      console.debug('decryptFile use config: ', options)
    }
    return crypto.AES.decrypt(fileData, key, {
      format: KatuCryptoFormatter
    }).toString()
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
    const cpk = getCpk(this.config.usePackageVersion)
    const edh = this.packExtraData(extraData)
    const plaintext = await cpk.cpt(imagePath, edh)
    const encryptedData = this.encryptFile(plaintext, key, cpk.dea)
    const encryptedPackage = encryptedData + await cpk.cmd(salt, extraData)
    console.debug('加密信息:')
    this.printDebugInfo({key, salt, extraData, edh, plaintext, encryptedData, encryptedPackage})
    await file.writeFile(savePath, encryptedPackage, 'hex')
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
    const cpk = await getCpkFromFile(imagePath)

    const encryptedData = await cpk.eed(imagePath)
    const plaintext = await this.decryptFile(encryptedData, key, cpk.dea)
    if(!plaintext) throw Error("解密错误")
    const { image, extraData } = await cpk.spt(plaintext, imagePath)
    // 检测并解密附加数据
    try {
      decryptedImage.extraData = this.unpackExtraData(extraData)
    } catch (error) {
      console.error('unpackExtraData err:', error, extraData)
      throw Error("附加数据读取出错")
    }

    console.debug('解密信息:')
    this.printDebugInfo({key, image, edh:extraData, extraData:decryptedImage.extraData, plaintext, encryptedData})
    
    await file.writeFile(decryptedImage.savePath, image, 'hex')
    return decryptedImage
  }

  unpackExtraData(edHexData:string): string[][]{
    if(!edHexData) return []
    return JSON.parse(convert.hex2string(edHexData))
  }

  packExtraData(extraData){
    let ed = JSON.stringify(extraData)
    if(ed !== '[]') {
        ed = convert.string2hex(ed)
    }else{
        ed = ''
    }
    console.log('packExtraData',ed,ed.length)
    return ed
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

  printDebugInfo(obj){
    console.table({
      ['encrypted Package']: {
        data: '-',
        length: obj.encryptedPackage?.length || '-',
      },
      ['encrypted Data']: {
        data: '-',
        length: obj.encryptedData?.length || '-',
      },
      ['plaintext']: {
        data: '-',
        length: obj.plaintext?.length || '-',
      },
      image: {
        data: '-',
        length: obj.image?.length || '-',
      },
      ['extraData Hex']: {
        data: obj.edh,
        length: obj.edh?.length || '-',
      },
      extraData: {
        data: JSON.stringify(obj.extraData),
        length: obj.extraData?.length || '-',
      },
      salt: {
        data: obj.salt,
        length: obj.salt?.length || '-',
      },
      key: {
        data: obj.key,
        length: obj.key?.length || '-',
      }
    })
  }
}


function getCryptoModule(){
  return Crypto.getInstance<Crypto>()
}

export {
  getCryptoModule
}