interface IKeyPair { 
  key: string
  salt: string 
}

type HashType = 'MD5' | 'SHA1' | 'SHA256'

interface IKeyPack {
  keyPack: string
  keyId: string
  hexKeyId: string
  ccv: string
}
interface IMasterKeyPack extends IKeyPack {
  
}

interface IMiniKeyPack extends IKeyPack {
  
}

interface IResetKeyPack {
  createTime: string
  keyId: string
  pack: string
  qrId: string
  ccv: string
}

interface ICryptoConfig {
  useCommonCryptoVersion: string,
  usePackageVersion: string
}

interface CommonKeyPairOptions {
  key: string
  salt?: string
  ccv?: string
}

interface IEncryptImageOptions {
  keyPair: IKeyPair 
  imagePath: string
  savePath: string
  extraData: string[][]
}

interface IDecryptImageOptions {
  imagePath: string
  savePath: string
  keyPair: IKeyPair 
}

type Pbkdf2Options = {
  salt: string 
  keySize: number
  iterations: number
}