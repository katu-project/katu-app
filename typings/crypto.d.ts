type KeyPair = {key:string, salt:string}

type HashType = 'MD5' | 'SHA1' | 'SHA256'

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

type Pbkdf2Options = {salt:string, size:number, iterations:number}