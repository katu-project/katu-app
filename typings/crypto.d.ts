type KeyPair = {key:string, salt:string}

type HashType = 'SHA1' | 'SHA256'

interface IAppCryptoConfig {
  masterKeyLength: number,
  calculateKeyId: {
    method: HashType,
    length: number
  },
  userKeyConvert: {
    method: HashType
  }
}