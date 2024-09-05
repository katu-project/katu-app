import Module from "@/class/module"
import { file } from "@/utils/index"
import webdav from "./webdav"
import cos from "./cos"

class Storage extends Module {
  ServiceTypeLabel = {
    'tencent.cos': {
      label: '腾讯云 COS',
      name: 'tencent.cos',
      prefix: 's3+://'
    },
    'cloudflare.r2': {
      label: 'Cloudflare',
      name: 'cloudflare.r2',
      prefix: 's3+://'
    },
    'webdav': {
      label: 'WebDAV',
      name: 'webdav',
      prefix: 'webdav://'
    }
  }

  constructor(){
    super()
  }
  
  get ServiceList(){
    return Object.entries(this.ServiceTypeLabel).map(e=>e[1])
  }

  init(){
    console.debug('Module Storage inited')
  }

  getDefaultConfig(serviceType?){
    const baseConfig = {
      enable: false,
      type: serviceType,
      bucket: '',
      region: '',
      secret: {
        secretId: '',
        secretKey: ''
      }
    }
    if(serviceType === 'cloudflare.r2'){
      baseConfig.region = 'auto'
      baseConfig.secret['accountId'] = ''
    }

    if(serviceType === 'webdav'){
      baseConfig.region = 'auto'
    }

    return baseConfig
  }

  async connectTest(cosConfig:ICustomStorageConfig){
    const testContent = `katu custom storage connect test, ${this.currentTimestamp}`
    const testFile = await this.getTempFilePath('cos-connect-test.txt')
    await file.writeFile(testFile, testContent)
    const fileKey = testFile.split('/').at(-1)!

    const cosTest = async ()=>{
      const cosClient = new cos.Client(cosConfig)
      try {
        await cosClient.upload(fileKey, testFile)
        await file.deleteFile(testFile)
        await cosClient.download(fileKey, testFile)
      } catch (error:any) {
        error['code'] = 1
        throw error
      }
    }

    const webdavTest = async ()=>{
      const client = new webdav.Client(cosConfig)
      try {
        await client.upload(fileKey, testFile)
        await file.deleteFile(testFile)
        await client.download(fileKey, testFile)
      } catch (error:any) {
        error['code'] = 1
        throw error
      }
    }

    switch (cosConfig.type) {
      case 'tencent.cos':
      case 'cloudflare.r2':
        await cosTest()
        break
      case 'webdav':
        await webdavTest()
        break
    }

    const downTestFileContent = await file.readFile(testFile, 'utf8')
    if(downTestFileContent !== testContent) throw Error('内容检查错误')
  }

  async saveCardImage(filePath:string, storageConfig:ICustomStorageConfig){
    const uploadInfo = await this.invokeApi('getUploadInfo', { type: 'card' })
    const prefix = this.ServiceTypeLabel[storageConfig.type].prefix

    switch(storageConfig.type) {
      case 'tencent.cos':
      case 'cloudflare.r2':
        const cosClient = new cos.Client(storageConfig)
        await cosClient.upload(uploadInfo.cloudPath, filePath)
        break
      case 'webdav':
        const client = new webdav.Client(storageConfig)
        // 目前 webdav 不能创建子目录，将路径中的 / 替换为 _
        const fileKey = uploadInfo.cloudPath.replace(/\//g,'_')
        await client.upload(fileKey, filePath)
        break
      default:
        throw Error('未知的存储类型')
    }

    return `${prefix}${uploadInfo.cloudPath}`
  }

  async downloadCardImage(url:string, savePath:string, storageConfig:ICustomStorageConfig){
    const prefix = url.split('://')[0] + '://'
    const cloudPath = url.slice(prefix.length)
    const storageType = Object.values(this.ServiceTypeLabel).find(e=>e.prefix === prefix)
    if(!storageType) throw Error('未知的存储类型')

    switch(storageType.name){
      case 'tencent.cos':
      case 'cloudflare.r2':
        const cosClient = new cos.Client(storageConfig)
        await cosClient.download(cloudPath, savePath)
        break
      case 'webdav':
        const client = new webdav.Client(storageConfig)
        // 目前 webdav 不能创建子目录，将路径中的 / 替换为 _
        const fileKey = cloudPath.replace(/\//g, '_')
        await client.download(fileKey, savePath)
        break
      default:
        throw Error('未知的存储类型')
    }

    return savePath
  }

  checkUseCustomStorage(url:string){
    return Object.values(this.ServiceTypeLabel).some(e=>url.startsWith(e.prefix))
  }
}


function getStorageModule(){
  return Storage.getInstance<Storage>()
}

export {
  getStorageModule
}