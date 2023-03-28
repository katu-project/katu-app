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

interface IEncryptImageOptions {
  keyPair: KeyPair 
  imagePath: string
  savePath: string
  extraData: string[][]
}

interface IDecryptImageOptions {
  imagePath: string
  savePath: string
  keyPair: KeyPair 
}

type Pbkdf2Options = {salt:string, size:number, iterations:number}