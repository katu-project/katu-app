type KeyPair = {key:string, salt:string}

type HashType = 'MD5' | 'SHA1' | 'SHA256'

type CpkVersion = 'v0'

type CommonCryptoVersion = 'v0' | 'v1'
interface IMasterKeyPack {
  keyPack: string
  keyId: string
  hexKeyId: string
  ccv: CommonCryptoVersion
}

interface IRecoveryKeyPack {
  createTime: string
  keyId: string
  pack: string
  qrId: string
}
interface ICryptoPackage {
  ver: CpkVersion
  mid: string
  dea: any
  cpt: (imagePath: string, extraData: string) => Promise<string>
  cmd: (salt: string, extraData: string[][]) => Promise<string>
  eed: (imagePath: string) => Promise<string>
  spt: (plaintext: string, imagePath: string) => Promise<{image: string, extraData: string}>
}

interface ICryptoConfig {
  defaultCommonCryptoVersion: CommonCryptoVersion,
  useCommonCryptoVersion: CommonCryptoVersion,
  usePackageVersion: CpkVersion
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

type Pbkdf2Options = {
  salt: string 
  keySize: number
  iterations: number
}