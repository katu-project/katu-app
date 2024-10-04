import Base from '@/class/base'
import Const from "@/const"
import Config from '@/config/index'
import { cache, file, crypto, checkTimeout, chooseLocalImage, scanQrcode } from "@/utils/index"
import api from '@/api'

type ApiType = typeof api
type LocalCacheKeyType = keyof typeof Const.LOCAL_CACHE_KEYS

export default class Core extends Base {
  DeviceInfo: Partial<WechatMiniprogram.SystemInfo> = {}

  get platform(){
    return this.DeviceInfo.platform || 'unknown'
  }

  get isMac(){
    return this.platform === 'mac'
  }

  get isAndroid(){
    return this.platform === 'android'
  }

  get isIos(){
    return this.platform === 'ios'
  }

  get isMp(){
    // #if MP
    return true
    // #endif
    return false
  }

  get isApp(){
    // #if NATIVE
    return true
    // #endif
    return false
  }

  async invokeApi<K extends keyof ApiType, R = ReturnType<ApiType[K]>>(apiName: K, ...args:Parameters<ApiType[K]>):Promise<Awaited<R>>{
    console.debug('执行 API 请求: ', apiName, args)
    // @ts-ignore 类型识别有问题，先跳过
    return api[apiName](...args)
  }

  getConst<T extends keyof typeof Const>(key:T){
    return Const[key]
  }

  getConfig<T extends keyof IAppConfig>(key:T){
    return typeof key === 'object' ? this.deepCloneObject(Config.App[key]) : Config.App[key]
  }

  getCardConfig<T extends keyof ICardConfig>(key:T){
    return this.deepCloneObject(Config.Card[key])
  }

  getCryptoConfig<T extends keyof ICryptoConfig>(key:T){
    return Config.Crypto[key]
  }

  getRequestConfig<T extends keyof IRequestConfig>(key:T){
    return Config.Request[key]
  }

  getDocConfig<T extends keyof IDocConfig>(key:T){
    return Config.Doc[key]
  }

  get cryptoConfig(){
    return Config.Crypto
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

  get scanQrcode(){
    return scanQrcode
  }

  setBaseInfo(systemInfo){
    this.DeviceInfo = systemInfo
  }

  async getLocalData<T>(key: LocalCacheKeyType) {
    try {
      return await cache.getCache<T>(Const.LOCAL_CACHE_KEYS[key])
    } catch (_) {}
    return
  }

  async setLocalData(key: LocalCacheKeyType, data) {
    return cache.setCache(Const.LOCAL_CACHE_KEYS[key], data)
  }

  async deleteLocalData(key: LocalCacheKeyType) {
    try {
      await cache.delCache(Const.LOCAL_CACHE_KEYS[key])
    } catch (error) {
      console.error(error)
    }
  }

  async deleteAllLocalData() {
    for (const key in Const.LOCAL_CACHE_KEYS) {
      await this.deleteLocalData(key as LocalCacheKeyType)
    }
  }

  async chooseLocalImage(){
    if(this.isMac){
      throw Error('当前客户端不支持该功能')
    }
    getApp().globalData.state.push('InSelectFile')
    const chooseTempFile = await chooseLocalImage()
    let userTempFile = ''
    if(chooseTempFile){
      userTempFile = await this.getTempFilePath(`cli-${this.currentTimestamp}`)
      await file.saveTempFile(chooseTempFile, userTempFile)
    }
    return userTempFile
  }

  async previewImage(pics: string[], idx?:number){
    getApp().globalData.state.push('inPreviewPic')
    wx.previewImage({
      urls: pics,
      current: pics[idx || 0]
    })
  }

  async getImageType(path: string) {
    return file.getImageType(path)
  }

  async getImageHash(filePath: string, hash?: string) {
    const fileHexData = await file.readFile(filePath, 'hex')
    const hashValue = crypto[hash || this.getConfig('imageNameFormatHashMethod')].call(null, fileHexData)
    console.debug('getHash: ', filePath, hashValue)
    return hashValue as string
  }

  async getTempFilePath(fileName: string) {
    return this.getFilePath(this.getConst('APP_TEMP_DIR'), fileName)
  }

  async getRootPath(fileName: string) {
    return this.getFilePath(this.getConst('APP_ROOT_DIR'), fileName)
  }

  async getMiniKeyPath(keyId: string) {
    return this.getFilePath(this.getConst('APP_MINI_KEY_DIR'), keyId)
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
    const downloadInfo = await this.invokeApi('getDownloadInfo', { fileId:url })
    console.debug('downloadInfo: ', downloadInfo)
    await this.invokeApi('downloadFile', {
      url: downloadInfo.url,
      options:{
        savePath
      }
    })
    return savePath
  }

  async uploadFile(filePath:string, type:UploadFileType) {
    const uploadInfo = await this.invokeApi('getUploadInfo', { type })
    if(uploadInfo.cos){
      const prefix = 's3://'
      const options = uploadInfo.cos
      await this.invokeApi('cosUpload', {
        filePath,
        options
      })
      return `${prefix}${uploadInfo.cloudPath}`
    }
    return this.invokeApi('uploadFile', filePath, uploadInfo)
  }
} 