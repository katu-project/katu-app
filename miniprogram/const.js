const CryptoJS = require('crypto-js')

const APP_ROOT_DIR = `${wx.env.USER_DATA_PATH}/katu`
const APP_TEMP_DIR = `${APP_ROOT_DIR}/temp`
const MASTER_KEY_NAME = 'KATU_MASTER_KEY'

const KatuCryptoFormatter = {
  stringify: function(cipherParams) {
    const CipherTextHeadMark = [0x9527,0x4396]
    const wordArray = CryptoJS.lib.WordArray.create(CipherTextHeadMark)
                               .concat(cipherParams.iv)
                               .concat(cipherParams.ciphertext)
    return wordArray.toString()
  },
  parse: function(encryptedHexString) {
      const CipherTextHeadMark = [0x9527,0x4396]
      const ciphertext = CryptoJS.enc.Hex.parse(encryptedHexString)
     
      const ciphertextWords = ciphertext.words
      if(ciphertextWords[0] !== CipherTextHeadMark[0] || ciphertextWords[1] !== CipherTextHeadMark[1]){
          throw Error("ciphertext format error")
      }
      const iv = CryptoJS.lib.WordArray.create(ciphertextWords.slice(2,6))
      
      ciphertextWords.splice(0,6)
      ciphertext.sigBytes -= 24
     
      return CryptoJS.lib.CipherParams.create({
          ciphertext: ciphertext,
          iv: iv
      })
  }
}

module.exports = {
  MASTER_KEY_NAME,
  APP_ROOT_DIR,
  APP_TEMP_DIR,
  KatuCryptoFormatter
}