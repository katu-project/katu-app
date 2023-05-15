import { APP_DOWN_DIR, APP_IMAGE_DIR, APP_ROOT_DIR, APP_TEMP_DIR, WX_CLOUD_STORAGE_FILE_HEAD, DEFAULT_IMAGE_HASH_METHOD } from "@/const"
import { getCache, selfish, setCache, delCache, file, net, crypto } from "@/utils/index"
import mitt from 'mitt'
const emitter = mitt()

export default class Base {
  private emitter = emitter
  static instance: Base
  static getInstance<T extends Base>(){
      if(!this.instance){
          this.instance = selfish(new this())
      }
      return this.instance as T
  }

  get on(){
    return this.emitter.on
  }
  
  get off(){
    return this.emitter.off
  }

  get emit(){
    return this.emitter.emit
  }

  getEeventList(){
    return this.emitter.all
  }
  // event end

  async getLocalData<T>(key:string){
    try {
      const res: T = await getCache(key)
      return res
    } catch (error) {
      console.warn('getLocalData:', key, error)
    }
    return
  }
  
  async setLocalData(key, data){
    return setCache(key, data)
  }

  async deleteLocalData(key:string){
    try {
      await delCache(key)
    } catch (error) {
      console.error(error)
    }
  }
  
  async uploadFile(filePath:string, cloudPath:string){
    return net.uploadCloudFile(filePath, cloudPath)
  }

  async getTempFilePath(fileName:string){
    return file.getFilePath({
      dir: APP_TEMP_DIR,
      name: fileName
    })
  }

  async getDownloadFilePath(image: Pick<ICardImage,'url'>){
    const splitUrl = image.url.split('/')
    const fileName = splitUrl[splitUrl.length - 1]
    if(!fileName){
      throw Error('图片文件名不能为空')
    }
    return file.getFilePath({
      dir: APP_DOWN_DIR,
      name: fileName
    })
  }

  async getImageType(path:string){
    return file.getImageType(path)
  }

  async getImageHash(filePath:string, hash?:string){
    const fileHexData = await file.readFile(filePath, 'hex')
    const hashValue = crypto[hash || DEFAULT_IMAGE_HASH_METHOD].call(null,fileHexData)
    console.debug('getHash: ',filePath, hashValue)
    return hashValue as string
  }

  async getImageFilePath(image: Pick<ICardImage,'url'>){
    const splitUrl = image.url.split('/')
    const fileName = splitUrl[splitUrl.length - 1]
    if(!fileName){
      throw Error('图片文件名不能为空')
    }
    return file.getFilePath({
      dir: APP_IMAGE_DIR,
      name: fileName
    })
  }

  async getHomePath(fileName:string){
    return file.getFilePath({
      dir: APP_ROOT_DIR,
      name: fileName
    })
  }

  async downloadFile(options:{url:string,savePath?:string,ignoreCache?:boolean}){
    let {url, savePath} = options
    if(!savePath){
      savePath = await this.getTempFilePath('down')
    }else{
      if(!options.ignoreCache){
        try {
          await file.checkAccess(savePath)
          console.debug('downloadFile: hit cache file, reuse it')
          return savePath
        } catch (error) {
          console.debug('downloadFile: no cache file, download it')
        }
      }
    }
    
    console.debug(`start download file:`, url)
    if(url.startsWith(WX_CLOUD_STORAGE_FILE_HEAD)){
      try {
        const { tempFilePath } = await wx.cloud.downloadFile({ fileID: url })
        console.debug('download tempFilePath:', tempFilePath)
        // 不能使用moveFile，moveFile无权限操作临时文件
        await file.saveTempFile(tempFilePath, savePath)
      } catch (error:any) {
        console.error('download Cloud File error:', error.errMsg)
        throw Error('文件下载失败')
      }
      return savePath
    }

    const downloadRes = await net.download(url, savePath)
    if(downloadRes.statusCode !== 200 || !downloadRes.filePath){
      throw Error("文件下载出错")
    }
    return downloadRes.filePath
  }
}