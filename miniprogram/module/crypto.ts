import Module from "@/class/module"
import { getCpk, getPackageCpk } from '@katucloud/cpk'
import { bip39, convert, crypto, file } from "@/utils/index"

const CommonError = "内部参数错误"
const ConvertUserKeyError = '密码转换处理失败'
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
const CommonCryptoVersionMap = {
  'v0': {
    commonKey: {
      method: 'random',
      length: 16
    },
    calculateKeyId: {
      method: 'SHA1',
      length: 40
    },
    keyConvert: {
      method: 'SHA1',
      length: 40
    },
    keyPair: {
      method: 'PBKDF2',
      options: {
        keySize: 4,
        iterations: 5000
      },
      saltLength: 16
    }
  }
}

class Crypto extends Module {
  _config = {} as ICryptoConfig

  init(config:ICryptoConfig){
    console.debug('使用加密配置:')
    console.table(config)
    this._config = config
    console.debug('Module Crypto inited')
  }

  get config(){
    return this._config
  }

  // 当前默认使用的 ccv 版本
  get ccv(){
    return this.config.useCommonCryptoVersion
  }

  getStringHash(str:string, method:HashType){
    return crypto[method](str) as string
  }
  
  encryptString(text,key){
    return crypto.encryptString(text,key)
  }

  decryptString(ciphertext,key){
    return crypto.decryptString(ciphertext,key)
  }

  encryptText(plaintext:string, key:string, options:any){
    console.debug('encryptFile use config: ', options)
    const cryptoMethod = options.cryptoMethod
    return crypto[cryptoMethod].encrypt(plaintext, key, {
      format: KatuCryptoFormatter
    })
  }

  decryptText(ciphertext:string, key:string, options:any){
    console.debug('decryptFile use config: ', options)
    const cryptoMethod = options.cryptoMethod
    return crypto[cryptoMethod].decrypt(ciphertext, key, {
      format: KatuCryptoFormatter
    })
  }

  async encryptImage({keyPair:{key, salt}, imagePath, extraData, savePath}: IEncryptImageOptions){
    const ccv = this.ccv
    const cpk = getCpk(this.config.usePackageVersion)
    // 附加数据对象 -> JSON 字符串 -> Hex 字符串
    const edh = this.packExtraData(extraData)
    const imageHex = await file.readFile<string>(imagePath, 'hex')
    const plaintext = await cpk.cpt(imageHex, edh)
    const encryptedData = this.encryptText(plaintext, key, cpk.dea)
    const encryptedPackage = encryptedData + await cpk.cmd({
      salt,
      edhl: edh.length,
      ccv
    })
    console.debug(`cpk 版本: ${cpk.ver}, ccv 版本: ${ccv}`)
    this.printDebugInfo({key, salt, extraData, edh, plaintext, encryptedData, encryptedPackage})
    await file.writeFile(savePath, encryptedPackage, 'hex')
    return {
      path: savePath,
      ccv,
      keySalt: salt,
    }
  }

  async decryptImage({imagePath, savePath, keyPair:{key}}:IDecryptImageOptions){
    const ccv = this.ccv
    const decryptedImage:{savePath: string, extraData: any[]} = {
      savePath,
      extraData: []
    }
    const packageHex = await file.readFile<string>(imagePath, 'hex')
    const cpk = await getPackageCpk(packageHex)
    const encryptedData = await cpk.eed(packageHex)
    const plaintext = await this.decryptText(encryptedData, key, cpk.dea)
    if(!plaintext) throw Error("解密错误")
    const { image, extraData } = await cpk.spt(plaintext, packageHex)
    // 检测并解密附加数据
    try {
      decryptedImage.extraData = this.unpackExtraData(extraData)
    } catch (error) {
      console.error('unpackExtraData err:', error, extraData)
      throw Error("附加数据读取出错")
    }

    console.debug(`解密版本: ${cpk.ver}, ccv 版本: ${ccv}`)
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

  randomHex(length:number){
    if(length === 0 || length%2 !== 0) throw Error(CommonError)
    return crypto.random(length/2)
  }

  async createCommonKeyPair({key, salt, ccv}: CommonKeyPairOptions): Promise<IKeyPair>{
    const { method, options, saltLength } = CommonCryptoVersionMap[ccv || this.ccv].keyPair
    try {
      if(!crypto[method] || typeof crypto[method] !== 'function') throw Error(`无此方法: ${method}`)
      options.salt = salt || await this.randomHex(saltLength)
      const keyPair = await crypto[method].call(null, key, options)
      return keyPair
    } catch (error:any) {
      console.error('createCommonKeyPair: ' + error.message || error)
      throw Error('创建密码对错误')
    }
  }

  convertToHexString(key:string, ccv?: string){
    const {method, length} = CommonCryptoVersionMap[ccv || this.ccv].keyConvert
    try {
    if(!crypto[method] || typeof crypto[method] !== 'function') throw Error(`无此方法: ${method}`)
      const hexCode:string = crypto[method].call(null,key)
      if(!hexCode) throw Error(`${method} 返回值无效`)
      return length ? hexCode.slice(0,length) : hexCode
    } catch (error:any) {
      console.error('convertToHexString: ' + error.message || error)
      throw Error(ConvertUserKeyError)
    }
  }

  calculateKeyId(key:string, ccv?: string){
    const {method, length} = CommonCryptoVersionMap[ccv || this.ccv].calculateKeyId
    try {
      if(!crypto[method] || typeof crypto[method] !== 'function') throw Error(`无此方法: ${method}`)
      const hexCode:string = crypto[method].call(null,key)
      if(!hexCode) throw Error(`${method} 返回值无效`)
      return length ? hexCode.slice(0,length) : hexCode
    } catch (error:any) {
      console.error('calculateKeyId: ' + error.message || error)
      throw Error(CalculateKeyIdError)
    }
  }

  verifyKeyId(key:string, keyPack:IMasterKeyPack){
    if(this.calculateKeyId(key, keyPack.ccv) !== keyPack.keyId) throw Error("密码ID未通过验证")
  }

  /**
   * 生成/更新主密码包
   * @param userOriginKey 用户设置的密码
   * @param masterKey 应用主密码
   * @returns
   */
  async createCommonKeyPack(userOriginKey: string, masterKey?: string){
    const ccv = this.ccv
    if(!masterKey){
      const { method, length } = CommonCryptoVersionMap[ccv].commonKey
      if(!crypto[method] || typeof crypto[method] !== 'function') throw Error(CommonError)
      masterKey = await crypto[method].call(null, length) as string
    }
    // 输入的原始密码统一使用 ccv 里配置的 hash 方法转化一遍
    const userKey = this.convertToHexString(userOriginKey)
    const keyPack:IMasterKeyPack = {
      keyPack: this.encryptString(masterKey, userKey),
      hexKeyId: this.calculateKeyId(userKey),
      keyId: this.calculateKeyId(masterKey),
      ccv
    }
    return keyPack
  }

  /**
   * 使用用户设置的密码从密码包中提取应用主密码
   * @param keyPack 
   * @param userOriginKey 
   * @returns 
   */
  async fetchKeyFromKeyPack(keyPack:IKeyPack, userOriginKey:string){
    const userKey = this.convertToHexString(userOriginKey, keyPack.ccv)
    const key = this.decryptString(keyPack.keyPack, userKey)
    if(!key) throw Error("密码有误")
    return key
  }

  async createResetKey(masterKey:string){
    const createBip39Key = () => {
      const words = bip39.generateMnemonic()
      return bip39.mnemonicToEntropy(words)
    }

    // 预设功能: 在后面使用重置码重置主密码时，可以检测重置码是否有效【ccv 用于选择合适的id算法】
    const createResetKeyPack = async (rkContent, dkey) => {
      const ccv = this.ccv
      const keyPack: IResetKeyPack = {
        qrId: rkContent.id,
        createTime: rkContent.time,
        keyId: this.calculateKeyId(rkContent.rk, ccv),
        pack: this.encryptString(dkey, rkContent.rk),
        ccv
      }
      return keyPack
    }

    const createResetKeyContent = async () => {
      const qrId = await this.randomHex(4)
      return {
        id: qrId.toUpperCase(),
        time: new Date().toLocaleDateString(),
        rk: createBip39Key()
      }
    }

    const createResetKeyQrCodePack = async (rkContent) => {
      const qrPack = {
        i: rkContent.id,
        t: rkContent.time,
        rk: rkContent.rk
      }
      return qrPack
    }

    const rkContent = await createResetKeyContent()
    const keyPack = await createResetKeyPack(rkContent, masterKey)
    const qrPack = await createResetKeyQrCodePack(rkContent)
    return {
      keyPack,
      qrPack
    }
  }

  extractKeyFromResetKeyPack(keyPack:IResetKeyPack, rk:string){
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
        data: obj.salt || '-',
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