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
  const salt = options.salt ? CryptoJS.enc.Hex.parse(options.salt) : CryptoJS.lib.WordArray.random(128 / 8)
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
 * @param {string} imageHexData
 * @param {string} code 
 * @return { Hex }
 */
function encryptImage(imageHexData, code){
  console.log('key:',code);
  const fileHex = CryptoJS.enc.Hex.parse(imageHexData)
  return CryptoJS.AES.encrypt(fileHex, code, {
    format: KatuCryptoFormatter
  }).toString()
}

/**
 * 
 * @param {*} encryptedImageData
 * @param {*} code 
 * @return { Hex }
 */
function decryptImage(fileHexString, code){
  // const fileHex = CryptoJS.enc.Hex.parse(fileHexString)
  console.log(fileHexString.slice(0,32),fileHexString.length,code);
  const decryptedHex = CryptoJS.AES.decrypt(fileHexString, code, {
    format: KatuCryptoFormatter
  }).toString()
  if(!decryptedHex) throw Error("decrypt fail")
  return decryptedHex
}

module.exports = {
  random,
  md5,
  sha256,
  sha512,
  pbkdf2,
  encryptString,
  decryptString,
  encryptImage,
  decryptImage,
  encrypt: encode,
  decrypt: decode
}