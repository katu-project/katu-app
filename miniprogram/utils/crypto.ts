const CryptoJS = require('crypto-js')
import { BufferToHex } from './convert'

export const HexCoding = CryptoJS.enc.Hex
export const AES = CryptoJS.AES
export const AES_MODE = CryptoJS.mode
export const AES_PAD = CryptoJS.pad

export function createWordArray(words){
  return CryptoJS.lib.WordArray.create(words)
}

export function createCipherParams(params){
  return CryptoJS.lib.CipherParams.create(params)
}

export async function random(bytesLength: number){
  if(!bytesLength) {
    throw Error("random bytesLength error")
  }
  let randomHexSring = ''
  try {
    const {randomValues} = await wx.getRandomValues({
      length: bytesLength,
    })
    randomHexSring = BufferToHex(randomValues)
  } catch (error) {
    console.warn('获取系统随机数出错，将使用内置替代库：', error)
    randomHexSring = CryptoJS.lib.WordArray.random(bytesLength).toString()
  }
  return randomHexSring
}

export async function randomBytesHexString(len: number){
  return random(len)
}

export const AES_256_CBC = {
  encrypt: function(plaintext:string, key:string, options){
    const cfg = {
      mode: AES_MODE.CBC,
      padding: AES_PAD.Pkcs7,
      format: options.format
    }
    plaintext = HexCoding.parse(plaintext)
    return AES.encrypt(plaintext, key, cfg).toString()
  },
  decrypt: function(ciphertext:string, key:string, options){
    const cfg = {
      mode: AES_MODE.CBC,
      padding: AES_PAD.Pkcs7,
      format: options.format
    } 
    return AES.decrypt(ciphertext, key, cfg).toString()
  }
}

export function MD5(string){
  return CryptoJS.MD5(string).toString()
}

export function SHA1(string){
  return CryptoJS.SHA1(string).toString()
}

export function SHA256(string){
  return CryptoJS.SHA256(string).toString()
}

export function SHA512(string){
  return CryptoJS.SHA512(string).toString()
}

export async function PBKDF2(mainKey: string, options: Pbkdf2Options) : Promise<{key:string, salt: string}>{
  const salt = HexCoding.parse(options.salt)
  const iterations = options.iterations
  const key = CryptoJS.PBKDF2(mainKey, salt, {
    keySize: options.size,
    iterations
  }).toString()
  return {key, salt: salt.toString()}
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

export default {
  random,
  randomBytesHexString,
  MD5,
  SHA1,
  SHA256,
  SHA512,
  AES,
  PBKDF2,
  encryptString,
  decryptString
}