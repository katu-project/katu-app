const CryptoJS = require('crypto-js')
const { Base64 } = require('js-base64')
const { ArrayBufferToBase64, Base64ToArrayBuffer } = require('./convert')
const { readFile } = require('./file')

function md5(string){
  return CryptoJS.MD5(string)
}

function toWordArray(str){
  return CryptoJS.enc.Utf8.parse(str);
}

function toString(words){
  return CryptoJS.enc.Utf8.stringify(words);
}

function toBase64String(words){
  return CryptoJS.enc.Base64.stringify(words);
}

const JsonFormatter = {
  stringify: function(cipherParams) {
    // create json object with ciphertext
    const jsonObj = { ct: cipherParams.ciphertext.toString(CryptoJS.enc.Hex) };

    // optionally add iv or salt
    if (cipherParams.iv) {
      jsonObj.iv = cipherParams.iv.toString();
    }

    if (cipherParams.salt) {
      jsonObj.s = cipherParams.salt.toString();
    }

    // stringify json object
    return JSON.stringify(jsonObj);
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
 * @return {Base64}
 */
async function encryptImage(imagePath, code){
  const imageHexData = await readFile(imagePath, 'hex')
  console.log(imageHexData.slice(0,32));
  // const base64Data = ArrayBufferToBase64(imageData)
  // const wordArrayData = CryptoJS.lib.WordArray.create(imageHexData)
  return CryptoJS.AES.encrypt(imageHexData, code, {
    format: JsonFormatter
  }).toString()
}

/**
 * 
 * @param {*} imagePath 
 * @param {*} code 
 * @return {ArrayBuffer}
 */
async function decryptImage(imagePath, code){
  const imageJsonData = await readFile(imagePath, 'utf-8')
  const imageHexData = CryptoJS.AES.decrypt(imageJsonData, code, {
    format: JsonFormatter
  }).toString(CryptoJS.enc.Utf8)
  if(!imageHexData) throw Error("decrypt fail")
  return imageHexData
}

module.exports = {
  md5,
  encryptString,
  decryptString,
  encryptImage,
  decryptImage,
  encrypt: encode,
  decrypt: decode
}