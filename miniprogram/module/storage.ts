import Module from "@/class/module"
import { file, cos } from "@/utils/index"
import { Client } from "@/utils/webdav"

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
      const uploadInfo = cos.getUploadInfo(fileKey, cosConfig)
      const cosDownUrl = cos.getDownloadInfo(fileKey, cosConfig)
      try {
        await this.invokeApi('cosUpload',{
          filePath: testFile,
          options: uploadInfo
        })
        await file.deleteFile(testFile)
        await this.invokeApi('downloadFile', {
          url: cosDownUrl,
          options: {
            savePath: testFile
          }
        })
      } catch (error:any) {
        error['code'] = 1
        throw error
      }
    }

    const webdavTest = async ()=>{
      const client = new Client({
        server: cosConfig.bucket,
        username: cosConfig.secret.secretId!,
        password: cosConfig.secret.secretKey!
      })
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
}


function getStorageModule(){
  return Storage.getInstance<Storage>()
}

export {
  getStorageModule
}