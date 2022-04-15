const CryptoJS = require('crypto-js')
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

const JsonFormatter = {
  stringify: function(cipherParams) {
    // create json object with ciphertext
    const jsonObj = { ct: cipherParams.ciphertext.toString(CryptoJS.enc.Hex)};

    // optionally add iv or salt
    if (cipherParams.iv) {
      jsonObj.iv = cipherParams.iv.toString();
    }

    if (cipherParams.salt) {
      jsonObj.s = cipherParams.salt.toString();
    }
    return jsonObj
  },
  parse: function(jsonStr) {
    // parse json string
    const jsonObj = JSON.parse(jsonStr);

    // extract ciphertext from json object, and create cipher params object
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Hex.parse(jsonObj.ct)
    });

    // optionally extract iv or salt

    if (jsonObj.iv) {
      cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
    }

    if (jsonObj.s) {
      cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s);
    }

    return cipherParams;
  }
}

function pbkdf2(masterKey){
  const salt = CryptoJS.lib.WordArray.random(128 / 8)
  return CryptoJS.PBKDF2(masterKey,salt,{
    keySize:4,iterations:5000
  }).toString()
}

function encode(text, code){
  return CryptoJS.AES.encrypt(text, code, {
    format: JsonFormatter
  });
}

function decode(text, code){
  return CryptoJS.AES.decrypt(text, code, {
    format: JsonFormatter
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
 * @param {string} imagePath 
 * @param {string} code 
 * @return { json }
 */
async function encryptImage(imagePath, code){
  const imageHexData = await readFile(imagePath, 'hex')
  return CryptoJS.AES.encrypt(imageHexData, code, {
    format: JsonFormatter
  }).toString()
}

/**
 * 
 * @param {*} encryptedImagePath 
 * @param {*} code 
 * @return { Hex string }
 */
async function decryptImage(encryptedImagePath, code){
  const imageJsonData = await readFile(encryptedImagePath, 'utf-8')
  const imageHexData = CryptoJS.AES.decrypt(imageJsonData, code, {
    format: JsonFormatter
  }).toString(CryptoJS.enc.Utf8)
  if(!imageHexData) throw Error("decrypt fail")
  return imageHexData
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