import { APP_DOWN_DIR, APP_IMAGE_DIR, APP_ROOT_DIR, APP_TEMP_DIR, WX_CLOUD_STORAGE_FILE_HEAD } from "@/const"
import { getCache, selfish, setCache, delCache, file, net } from "@/utils/index"
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
    const {fileID} = await wx.cloud.uploadFile({
      cloudPath,
      filePath
    })
    return fileID
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
    
    if(url.startsWith(WX_CLOUD_STORAGE_FILE_HEAD)){
      const {fileList: [imageInfo]} = await wx.cloud.getTempFileURL({
        fileList: [url]
      })
      if(imageInfo.status !== 0){
        console.error('get cloud file tempUrl error:', imageInfo.errMsg)
        throw Error('文件下载失败')
      }
      url = imageInfo.tempFileURL
    }

    console.debug('start download file:', url);
    const downloadRes = await net.download(url, savePath)
    if(downloadRes.statusCode !== 200 || !downloadRes.filePath){
      throw Error("文件下载出错")
    }
    return downloadRes.filePath
  }
}