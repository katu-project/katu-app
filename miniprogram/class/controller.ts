import Agent from '@/class/agent'
import api from "@/api"
import { navigateTo } from '@/utils/index'
import { getNoticeModule, getCryptoModule, getCacheModule } from '@/module/index'

export default class Controller extends Agent {
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

  async uploadFile(filePath:string, type:UploadFileType) {
    const uploadInfo = await api.getUploadInfo({ type })
    return api.uploadFile(filePath, uploadInfo)
  }

  goToPage(page:string, params?:string, vibrate?:boolean){
    const pagePath = `${page.startsWith('/') ? '':'/pages/'}${page}?${params}`
    return navigateTo(pagePath, vibrate || false)
  }

  navToDocPage(id){
    return this.goToPage('qa/detail/index',`id=${id}`)
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

  checkSmsTimeout(lastTime:number){
    return this.checkTimeout(lastTime, this.getConfig('smsGapTime'))
  }

  async checkCacheClearTimeout(){
    const lastTime = await this.getLastCacheClearTime()
    return this.checkTimeout(lastTime, this.getConfig('cacheClearGapTime'))
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
}