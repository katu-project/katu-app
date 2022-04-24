const CryptoJS = require('crypto-js')
const { KatuCryptoFormatter } = require('../const')
const { Base64 } = require('js-base64')
const { readFile } = require('./file')

function random(bytesLength){
  return CryptoJS.lib.WordArray.random(bytesLength)
}

function md5(string){
  return CryptoJS.MD5(string).toString()
}

function sha256(string){
  return CryptoJS.SHA256(string).toString()
}

function sha512(string){
  return CryptoJS.SHA256(string).toString()
}

function pbkdf2(masterKey, options={}){
  const salt = options.salt ? CryptoJS.enc.Hex.parse(options.salt) : CryptoJS.lib.WordArray.random(64 / 8)
  const key = CryptoJS.PBKDF2(masterKey,salt,{
    keySize: options.size || 4, 
    iterations: 5000
  }).toString()
  return {key, salt: salt.toString()}
}

function encode(text, code){
  return CryptoJS.AES.encrypt(text, code, {
    format: KatuCryptoFormatter
  });
}

function decode(text, code){
  return CryptoJS.AES.decrypt(text, code, {
    format: KatuCryptoFormatter
  })
}

function encryptString(string, code){
  return CryptoJS.AES.encrypt(string, code).toString()
}

function decryptString(string, code){
  return CryptoJS.AES.decrypt(string, code).toString(CryptoJS.enc.Utf8)
}

/**
 * 
 * @param {string} data Hex string
 * @param {string} code 
 * @return { Hex String }
 */
function encryptFile(fileHexString, code){
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
function decryptFile(fileHexString, code){
  const decryptedHexString = CryptoJS.AES.decrypt(fileHexString, code, {
    format: KatuCryptoFormatter
  }).toString()
  if(!decryptedHexString) throw Error("decrypt fail")
  return decryptedHexString
}

module.exports = {
  random,
  md5,
  sha256,
  sha512,
  pbkdf2,
  encryptString,
  decryptString,
  encryptFile,
  decryptFile,
  encrypt: encode,
  decrypt: decode
}