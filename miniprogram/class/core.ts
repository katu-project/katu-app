import Base from '@/class/base'
import Const from "@/const"
import Config from '@/config/index'
import { cache, file, crypto, checkTimeout } from "@/utils/index"
import api from '@/api'

export default class Core extends Base {

  getConst<T extends keyof typeof Const>(key:T){
    return Const[key]
  }

  getConfig<T extends keyof IAppConfig>(key:T){
    return typeof key === 'object' ? this.deepCloneObject(Config.App[key]) : Config.App[key]
  }

  get theme(){
    return Config.Theme
  }

  get menu(){
    return Config.Menu
  }

  get checkTimeout(){
    return checkTimeout
  }

  async getLocalData<T>(key: keyof typeof Const.LocalCacheKeyMap) {
    try {
      return await cache.getCache<T>(Const.LocalCacheKeyMap[key])
    } catch (_) {}
    return
  }

  async setLocalData(key: keyof typeof Const.LocalCacheKeyMap, data) {
    return cache.setCache(Const.LocalCacheKeyMap[key], data)
  }

  async deleteLocalData(key: keyof typeof Const.LocalCacheKeyMap) {
    try {
      await cache.delCache(Const.LocalCacheKeyMap[key])
    } catch (error) {
      console.error(error)
    }
  }

  async getImageType(path: string) {
    return file.getImageType(path)
  }

  async getImageHash(filePath: string, hash?: string) {
    const fileHexData = await file.readFile(filePath, 'hex')
    const hashValue = crypto[hash || this.getConst('DEFAULT_IMAGE_HASH_METHOD')].call(null, fileHexData)
    console.debug('getHash: ', filePath, hashValue)
    return hashValue as string
  }

  async getTempFilePath(fileName: string) {
    return this.getFilePath(this.getConst('APP_TEMP_DIR'), fileName)
  }

  async getRootPath(fileName: string) {
    return this.getFilePath(this.getConst('APP_ROOT_DIR'), fileName)
  }

  async getImageFilePath(image: Pick<ICardImage, 'url'>) {
    let checkUrl = image.url
     // 分享的卡片连接是http，需要移除请求参数
     if(checkUrl.startsWith('http')){
      checkUrl = checkUrl.split('?')[0]
    }
    const splitUrl = checkUrl.split('/')
    const fileName = splitUrl[splitUrl.length - 1]
    if (!fileName) {
      throw Error('图片文件名不能为空')
    }
    return this.getFilePath(this.getConst('APP_IMAGE_DIR'), fileName)
  }

  async getDownloadFilePath(image: Pick<ICardImage, 'url'>) {
    let checkUrl = image.url
    // 分享的卡片连接是http，需要移除请求参数
    if(checkUrl.startsWith('http')){
      checkUrl = checkUrl.split('?')[0]
    }
    const splitUrl = checkUrl.split('/')
    const fileName = splitUrl[splitUrl.length - 1]
    if (!fileName) {
      throw Error('图片文件名不能为空')
    }
    return this.getFilePath(this.getConst('APP_DOWN_DIR'), fileName)
  }

  async downloadFile(options: { url: string, savePath?: string, ignoreCache?: boolean }) {
    let { url, savePath } = options
    if (!savePath) {
      savePath = await this.getTempFilePath('down')
    } else {
      if (!options.ignoreCache) {
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
    await api.downloadFile({url, savePath})
    return savePath
  }

  async uploadFile(filePath:string, type:UploadFileType) {
    const uploadInfo = await api.getUploadInfo({ type })
    return api.uploadFile(filePath, uploadInfo)
  }
} 