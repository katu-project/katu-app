interface IKeyPair { 
  key: string
  salt: string 
}

type HashType = 'MD5' | 'SHA1' | 'SHA256'

type CommonCryptoVersion = 'v0' | 'v1'

interface IKeyPack {
  keyPack: string
  keyId: string
  hexKeyId: string
  ccv: CommonCryptoVersion
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
  ccv: CommonCryptoVersion
}
interface ICryptoPackage {
  ver: string
  dea: any
  cpt: (imagePath: string, extraData: string) => Promise<string>
  cmd: (salt: string, edhl:number) => Promise<string>
  eed: (imagePath: string) => Promise<string>
  spt: (plaintext: string, imagePath: string) => Promise<{ image: string, extraData: string }>
}

interface ICryptoConfig {
  useCommonCryptoVersion: CommonCryptoVersion,
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