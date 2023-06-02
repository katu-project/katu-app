import Base from '@/class/base'
import Const from "@/const"
import { navigateTo, getCache, setCache, delCache, file, net, crypto } from "@/utils/index"
import Config from '@/config/index'

export default class Core extends Base {

  getConst<T extends keyof typeof Const>(key:T){
    return Const[key]
  }

  getConfig<T extends keyof IAppConfig>(key:T){
    return Config.App[key]
  }

  get theme(){
    return Config.Theme
  }

  get menu(){
    return Config.Menu
  }

  async getLocalData<T>(key: string) {
    try {
      const res: T = await getCache(key)
      return res
    } catch (error) {
      console.warn('getLocalData:', key, error)
    }
    return
  }

  async setLocalData(key, data) {
    return setCache(key, data)
  }

  async deleteLocalData(key: string) {
    try {
      await delCache(key)
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
    const splitUrl = image.url.split('/')
    const fileName = splitUrl[splitUrl.length - 1]
    if (!fileName) {
      throw Error('图片文件名不能为空')
    }
    return this.getFilePath(this.getConst('APP_IMAGE_DIR'), fileName)
  }

  async getDownloadFilePath(image: Pick<ICardImage, 'url'>) {
    const splitUrl = image.url.split('/')
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
    if (url.startsWith(this.getConst('WX_CLOUD_STORAGE_FILE_HEAD'))) {
      await net.downloadCloudFile(url, savePath)
    }else{
      await net.download(url, savePath)
    }

    return savePath
  }

  navToDoc(id){
    navigateTo(`/pages/qa/detail/index?id=${id}`)
  }
} 