const CryptoJS = require('crypto-js')

const APP_ROOT_DIR = `${wx.env.USER_DATA_PATH}/katu`
const APP_TEMP_DIR = `${APP_ROOT_DIR}/temp`
const MASTER_KEY_NAME = 'KATU_MASTER_KEY'

const KatuCryptoFormatter = {
    stringify: function(cipherParams) {
      const KatuMark = [0x9527,0x4396]
      const SaltMark = [0x53616c74, 0x65645f5f]
      const salt = cipherParams.salt
      const ciphertext = cipherParams.ciphertext
      
      const wordArray = CryptoJS.lib.WordArray.create(KatuMark)
                        .concat(CryptoJS.lib.WordArray.create(SaltMark))
                        .concat(salt)
                        .concat(ciphertext)

      console.log('stringify salt:',salt.toString())
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

        console.log('parse salt:',salt.toString())
        return CryptoJS.lib.CipherParams.create({
            ciphertext,
            salt
        })
    }
}

module.exports = {
  MASTER_KEY_NAME,
  APP_ROOT_DIR,
  APP_TEMP_DIR,
  KatuCryptoFormatter
}