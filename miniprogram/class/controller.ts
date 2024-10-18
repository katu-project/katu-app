import Navigation from './navigation'
import { getNoticeModule, getCryptoModule, getCacheModule, getStorageModule } from '@/module/index'

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

  get storage(){
    return getStorageModule()
  }

  async checkImageType(picPath:string){
    try {
      const imageType = await this.getImageType(picPath)
      if(this.getConfig('allowUploadImageType').includes(imageType)) return
    } catch (error) {
      console.error('image type check err:',error)
    }
    throw Error(this.t_e('image_format_error'))
  }

  // Unused
  checkSmsTimeout(lastTime:number){
    return this.checkTimeout(lastTime, this.getConfig('smsGapTime'))
  }

  async globalTaskTimeoutCheck(){
    const lastTime = await this.getLastCacheClearTime()
    return this.checkTimeout(lastTime, this.getConfig('cacheClearGapTime')) < 0
  }

  likeListCacheTimeoutCheck(time:number){
    return this.checkTimeout(time, this.getConfig('homeDataCacheTime')) < 0
  }
  
  userInfoCacheTimeout(cacheTime:number){
    return this.checkTimeout(cacheTime, this.getConfig('userInfoCacheTime')) < 0
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

  async sendVerifyCode(type: string, value){
    const { sign } = await this.invokeApi('getActionSign', {
      action: 'sendVerifyCode',
      value: value
    })
    return this.invokeApi('sendVerifyCode', {
      type,
      value,
      sign
    })
  }
}