import Navigation from './navigation'
import { file, editImage } from '@/utils/index'
import { getNoticeModule, getCryptoModule, getCacheModule } from '@/module/index'

export default class Controller extends Navigation {
  constructor(){
    super()
  }

  get notice(){
    return getNoticeModule()
  }

  get crypto(){
    return getCryptoModule()
  }

  get cache(){
    return getCacheModule()
  }

  async checkImageType(picPath:string){
    try {
      const imageType = await this.getImageType(picPath)
      if(!this.getConfig('allowUploadImageType').includes(imageType)) throw Error(`不支持 ${imageType} 图片格式`)
    } catch (error) {
      console.error('image type check err:',error)
      throw Error('图片格式不支持')
    }
  }

  async editImage(path:string){
    let tempImagePath = ''
    try {
      tempImagePath = await editImage(path)
    } catch (error:any) {
      if(error.errno && error.errno === 1 && error.errMsg.includes('cancel')){
        throw null
      }
      console.error(error)
      throw Error('功能暂时不可用')
    }
    if(!tempImagePath) throw Error('系统不支持该功能')
    const tempFilePath = await this.getTempFilePath(`wei-${this.currentTimestamp}`)
    await file.copyFile(tempImagePath, tempFilePath)
    return tempFilePath
  }

  checkSmsTimeout(lastTime:number){
    return this.checkTimeout(lastTime, this.getConfig('smsGapTime'))
  }

  async globalTaskTimeoutCheck(){
    const lastTime = await this.getLastCacheClearTime()
    try {
      this.checkTimeout(lastTime, this.getConfig('cacheClearGapTime'))
    } catch (error) {
      return true
    }
    return false
  }

  createAdvSetData(originSetData,dataCount:number,gap?:number){
    let dataSets: any[] = []
    let doIdx = 0
    gap = gap || 4
    return function(setData){
      dataSets.push(setData)
      doIdx ++
      if(dataSets.length % gap! !== 0 && doIdx !== dataCount){
        return
      }
      const _setData = dataSets.reduce((a,b)=>Object.assign(a,b))
      const _setDataLength = Object.keys(_setData).length
      if(_setDataLength){
        originSetData(_setData)
      }
      if(doIdx === dataCount){
        // console.debug('adv setData  end:',`${dataSets.length}/${dataCount}`)
      }else if(dataSets.length % gap! === 0){
        // console.debug('adv setData part:',`${dataSets.length}/${dataCount}`)
        dataSets = []
      } 
    }
  }

  async sendVerifyCode(type: 'sms'|'email', value){
    const { sign } = await this.api.getActionSign({
      action: 'sendVerifyCode',
      value: value
    })
    return this.api.sendVerifyCode({
      type,
      value,
      sign
    })
  }
}