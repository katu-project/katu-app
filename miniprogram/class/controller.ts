import Agent from '@/class/agent'
import api from "@/api"
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
    return api.uploadFile({ filePath, ...uploadInfo })
  }

  async checkImageType(picPath:string){
    try {
      const imageType = await this.getImageType(picPath)
      if(!this.allowUploadImageType.includes(imageType)) throw Error(`不支持 ${imageType} 图片格式`)
    } catch (error) {
      console.error('image type check err:',error)
      throw Error('图片格式不支持')
    }
  }
}