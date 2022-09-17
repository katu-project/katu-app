const CryptoJS = require('crypto-js')
import { BufferToHex } from './convert'

export const KatuCryptoFormatter = {
  stringify: function(cipherParams) {
    const KatuMark = [0x9527,0x4396]
    const SaltMark = [0x53616c74, 0x65645f5f]
    const salt = cipherParams.salt
    const ciphertext = cipherParams.ciphertext
    
    const wordArray = CryptoJS.lib.WordArray.create(KatuMark)
                      .concat(CryptoJS.lib.WordArray.create(SaltMark))
                      .concat(salt)
                      .concat(ciphertext)
    return wordArray.toString(CryptoJS.enc.Hex)
  },
  parse: function(encryptedHexString) {
      const KatuMark = [0x9527,0x4396]
      const SaltMark = [0x53616c74, 0x65645f5f]

      const ciphertext = CryptoJS.enc.Hex.parse(encryptedHexString)
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
          salt = CryptoJS.lib.WordArray.create(ciphertextWords.slice(2, 4));

          // Remove salt from ciphertext
          ciphertextWords.splice(0, 4);
          ciphertext.sigBytes -= 16;
      }

      return CryptoJS.lib.CipherParams.create({
          ciphertext,
          salt
      })
  }
}

export async function random(bytesLength: number){
  if(!bytesLength || bytesLength % 2 === 1) {
    throw Error("random bytesLength error")
  }
  let randomHexSring = ''
  try {
    const {randomValues} = await wx.getRandomValues({
      length: bytesLength / 2,
    })
    randomHexSring = BufferToHex(randomValues)
  } catch (error) {
    console.log('获取系统随机数出错，将使用内置替代库：', error)
    randomHexSring = CryptoJS.lib.WordArray.random(bytesLength / 2)
  }
  return randomHexSring
}

export function md5(string){
  return CryptoJS.MD5(string).toString()
}

export function sha1(string){
  return CryptoJS.SHA1(string).toString()
}

export function sha256(string){
  return CryptoJS.SHA256(string).toString()
}

export function sha512(string){
  return CryptoJS.SHA256(string).toString()
}

type Pbkdf2Options = {salt:string, size:number}
export function pbkdf2<T extends Pbkdf2Options = Pbkdf2Options>(masterKey: string, options?: Partial<T>){
  const salt = options?.salt ? CryptoJS.enc.Hex.parse(options.salt) : CryptoJS.lib.WordArray.random(64 / 8)
  const key = CryptoJS.PBKDF2(masterKey,salt,{
    keySize: options?.size || 4, 
    iterations: 5000
  }).toString()
  return {key, salt: salt.toString()}
}

export function encrypt(text, code){
  return CryptoJS.AES.encrypt(text, code, {
    format: KatuCryptoFormatter
  });
}

export function decrypt(text, code){
  return CryptoJS.AES.decrypt(text, code, {
    format: KatuCryptoFormatter
  })
}

export function encryptString(string, code){
  return CryptoJS.AES.encrypt(string, code).toString()
}

export function decryptString(string, code){
  try {
    return CryptoJS.AES.decrypt(string, code).toString(CryptoJS.enc.Utf8)
  } catch (error) {
    return ''
  }
}

/**
 * 
 * @param {string} data Hex string
 * @param {string} code 
 * @return { Hex String }
 */
export function encryptFile(fileHexString, code){
  const hexData = CryptoJS.enc.Hex.parse(fileHexString)
  return CryptoJS.AES.encrypt(hexData, code, {
                    format: KatuCryptoFormatter
                  }).toString()
}

/**
 * 
 * @param {*} encrypted hex string
 * @param {*} code 
 * @return { Hex String }
 */
export function decryptFile(fileHexString, code){
  const decryptedHexString = CryptoJS.AES.decrypt(fileHexString, code, {
    format: KatuCryptoFormatter
  }).toString()
  if(!decryptedHexString) throw Error("decrypt fail")
  return decryptedHexString
}

export default {
  random,
  md5,
  sha1,
  sha256,
  sha512,
  pbkdf2,
  encryptString,
  decryptString,  
  encryptFile,
  decryptFile,
  encrypt,
  decrypt
}