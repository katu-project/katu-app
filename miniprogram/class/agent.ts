import Core from '@/class/core'
import AppConfig from '@/config'
export default class Agent extends Core {

  async uploadAvatar(filePath:string){
    return this.uploadFile(filePath, AppConfig.uploadUserAvatarType)
  }

  async uploadShareFile(filePath:string){
    return this.uploadFile(filePath, AppConfig.uploadShareType)
  }

  async uploadCardFile(filePath:string){
    return this.uploadFile(filePath, AppConfig.uploadCardType)
  }

  async uploadTempFile(filePath:string){
    return this.uploadFile(filePath, AppConfig.uploadTempFileType)
  }
} 