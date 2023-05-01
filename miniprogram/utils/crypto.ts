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

/**
 * use sha1
 * keySize 4(4x32bits)
 * iterations 1
 * output hex 128bits
 * masterKey sha1 => 16 bytes
 * salt no limit, use random value: 16bytes
 */
export async function pbkdf2(masterKey: string, options?: Partial<Pbkdf2Options>) : Promise<{key:string, salt: string}>{
  const salt = CryptoJS.enc.Hex.parse(options?.salt || await randomBytesHexString(8))
  const iterations = options?.iterations || 1
  const key = CryptoJS.PBKDF2(masterKey,salt,{
    keySize: options?.size || 4, 
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
  pbkdf2,
  encryptString,
  decryptString
}