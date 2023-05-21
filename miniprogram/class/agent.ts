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

  // open app doc
  openUserUsageProtocol(){
    return this.navToDoc(AppConfig.doc.userUsageProtocol)
  }

  openUserPrivacyProtocol(){
    return this.navToDoc(AppConfig.doc.userPrivacyProtocol)
  }

  openDataSaveSecurityNoticeDoc(){
    return this.navToDoc(AppConfig.doc.dataSaveSecurityNotice)
  }

  openDataShareDoc(){
    return this.navToDoc(AppConfig.doc.dataShareNotice)
  }

  openDataCheckDoc(){
    return this.navToDoc(AppConfig.doc.dataCheckNotice)
  }

  openInternalApiNotice(){
    return this.navToDoc(AppConfig.doc.imageProcessorTip_1)
  }

  openRemoteApiNotice(){
    return this.navToDoc(AppConfig.doc.imageProcessorTip_2)
  }

  openRememberKeyNotice(){
    return this.navToDoc(AppConfig.doc.rememberKeyNotice)
  }

  openMasterKeyNotice(){
    return this.navToDoc(AppConfig.doc.masterKeyNotice)
  }

  openForgetKeyNotice(){
    return this.navToDoc(AppConfig.doc.forgetKeyNotice)
  }
  // open app doc end
} 