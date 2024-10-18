import Module from "@/class/module"
import { getCpk, getPackageCpk } from '@katucloud/cpk'
import { bip39, convert, crypto, file } from "@/utils/index"

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
      
      // remove katu mark
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
      method: 'RANDOM',
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
    console.debug('use crypto config:')
    console.table(config)
    this._config = config
    console.debug('Module Crypto inited')
  }

  get config(){
    return this._config
  }

  // if no ccv，use default ccv
  getCcv(ccv?:string){
    if(ccv && !CommonCryptoVersionMap[ccv]) {
      console.error('unknown ccv:' + ccv)
      throw Error(this.t_e('build_in_params_error'))
    }
    ccv = ccv || this.config.useCommonCryptoVersion
    return {
      ccv,
      item: CommonCryptoVersionMap[ccv] as typeof CommonCryptoVersionMap.v0
    }
  }

  getCpk(cpk?:string){
    if(cpk) {
      try {
        getCpk(cpk)
      } catch (error) {
        console.error('unknown cpk:' + cpk)
        throw Error(this.t_e('build_in_params_error'))
      }
    }
    cpk = cpk || this.config.usePackageVersion
    return {
      cpk,
      item: getCpk(cpk)
    }
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
    const { ccv } = this.getCcv()
    const { item:cpk } = this.getCpk(this.config.usePackageVersion)
    // extra data object -> JSON string -> Hex string
    const edh = this.packExtraData(extraData)
    const imageHex = await file.readFile<string>(imagePath, 'hex')
    const plaintext = await cpk.cpt(imageHex, edh)
    const encryptedData = this.encryptText(plaintext, key, cpk.dea)
    const encryptedPackage = encryptedData + await cpk.cmd({
      salt,
      edhl: edh.length,
      ccv
    })
    console.debug(`cpk version: ${cpk.ver}, ccv version: ${ccv}`)
    this.printDebugInfo({key, salt, extraData, edh, plaintext, encryptedData, encryptedPackage})
    await file.writeFile(savePath, encryptedPackage, 'hex')
    return {
      path: savePath,
      ccv,
      keySalt: salt,
    }
  }

  async decryptImage({imagePath, savePath, keyPair:{key}}:IDecryptImageOptions){
    const decryptedImage:{savePath: string, extraData: any[]} = {
      savePath,
      extraData: []
    }
    const packageHex = await file.readFile<string>(imagePath, 'hex')
    const cpk = await getPackageCpk(packageHex)
    const encryptedData = await cpk.eed(packageHex)
    const plaintext = await this.decryptText(encryptedData, key, cpk.dea)
    if(!plaintext) throw Error(this.t_e('decrypt_failed'))
    const { image, extraData } = await cpk.spt(plaintext, packageHex)
    // check and decrypt extra data
    try {
      decryptedImage.extraData = this.unpackExtraData(extraData)
    } catch (error) {
      console.error('unpackExtraData err:', error, extraData)
      throw Error(this.t_e('decrypt_extra_error'))
    }

    console.debug(`decrypt cpk : ${cpk.ver}, ccv : [todo]`)
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
    if(length === 0 || length%2 !== 0) throw Error(this.t_e('build_in_params_error'))
    return crypto.random(length/2)
  }

  async createCommonKeyPair({key, salt, ccv}: CommonKeyPairOptions): Promise<IKeyPair>{
    const { item:{ keyPair:{ method, options, saltLength } } } = this.getCcv(ccv)
    try {
      if(!crypto[method] || typeof crypto[method] !== 'function') throw Error(`no method: ${method}`)
      options['salt'] = salt || await this.randomHex(saltLength)
      const keyPair = await crypto[method].call(null, key, options)
      return keyPair
    } catch (error:any) {
      console.error('createCommonKeyPair: ' + error.message || error)
      throw Error(this.t_e('create_key_pack'))
    }
  }

  convertToHexString(key:string, ccv?: string){
    const { item:{ keyConvert: { method, length } } } = this.getCcv(ccv)
    try {
      if(!crypto[method] || typeof crypto[method] !== 'function') throw Error(`no method: ${method}`)
      const hexCode:string = crypto[method].call(null,key)
      if(!hexCode) throw Error(`${method} invalid return`)
      return length ? hexCode.slice(0,length) : hexCode
    } catch (error:any) {
      console.error('convertToHexString: ' + error.message || error)
      throw Error(this.t_e('convert_key_error'))
    }
  }

  calculateKeyId(key:string, ccv?: string){
    const { item:{ calculateKeyId: { method, length } } } = this.getCcv(ccv)
    try {
      if(!crypto[method] || typeof crypto[method] !== 'function') throw Error(`no method: ${method}`)
      const hexCode:string = crypto[method].call(null,key)
      if(!hexCode) throw Error(`${method} invalid return`)
      return length ? hexCode.slice(0,length) : hexCode
    } catch (error:any) {
      console.error('calculateKeyId: ' + error.message || error)
      throw Error(this.t_e('calculate_key_id_error'))
    }
  }

  verifyKeyId(key:string, keyPack:IMasterKeyPack){
    if(this.calculateKeyId(key, keyPack.ccv) !== keyPack.keyId) throw Error(this.t_e('key_id_not_match'))
  }

  /**
   * use any key create/update Master Key pack
   * @param key key for Master Key
   * @param masterKey Master Key
   * @returns
   */
  async createCommonKeyPack(key:string, masterKey?:string){
    const { ccv, item:{ commonKey: { method, length } } } = this.getCcv()
    if(!masterKey){
      if(!crypto[method] || typeof crypto[method] !== 'function') throw Error(this.t_e('build_in_params_error'))
      masterKey = await crypto[method].call(null, length) as string
    }
    // input origin key use hash convert method in ccv to convert
    const hexKey = this.convertToHexString(key)
    const keyPack:IMasterKeyPack = {
      keyPack: this.encryptString(masterKey, hexKey),
      hexKeyId: this.calculateKeyId(hexKey),
      keyId: this.calculateKeyId(masterKey),
      ccv
    }
    return keyPack
  }

  /**
   * fetch Master Key from key pack with user key
   * @param keyPack 
   * @param userOriginKey 
   * @returns 
   */
  async fetchKeyFromKeyPack(keyPack:IKeyPack, userOriginKey:string){
    const userKey = this.convertToHexString(userOriginKey, keyPack.ccv)
    const key = this.decryptString(keyPack.keyPack, userKey)
    if(!key) throw Error(this.t_e('bad_key'))
    return key
  }

  async createResetKey(masterKey:string){
    const createBip39Key = () => {
      const words = bip39.generateMnemonic()
      return bip39.mnemonicToEntropy(words)
    }

    // ccv not used now, 
    // todo: reset key in the future, check Reset Code if valid(use ccv choose id convert method)
    const createResetKeyPack = async (rkContent, dkey) => {
      const { ccv } = this.getCcv()
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
    if(!masterKey) throw Error(this.t_e('bad_key'))
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