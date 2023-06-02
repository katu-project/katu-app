import Core from '@/class/core'
export default abstract class Agent extends Core {

  abstract uploadFile(filePath:string, uploadType:UploadFileType): Promise<string>

  get _docMap(){
    return this.getConfig('doc')
  }

  async uploadAvatar(filePath:string){
    return this.uploadFile(filePath, this.getConfig('uploadUserAvatarType'))
  }

  async uploadShareFile(filePath:string){
    return this.uploadFile(filePath, this.getConfig('uploadShareType'))
  }

  async uploadCardFile(filePath:string){
    return this.uploadFile(filePath, this.getConfig('uploadCardType'))
  }

  async uploadTempFile(filePath:string){
    return this.uploadFile(filePath, this.getConfig('uploadTempFileType'))
  }

  // open app doc
  openUserUsageProtocol(){
    return this.navToDoc(this._docMap.userUsageProtocol)
  }

  openUserPrivacyProtocol(){
    return this.navToDoc(this._docMap.userPrivacyProtocol)
  }

  openDataSaveSecurityNoticeDoc(){
    return this.navToDoc(this._docMap.dataSaveSecurityNotice)
  }

  openDataShareDoc(){
    return this.navToDoc(this._docMap.dataShareNotice)
  }

  openDataCheckDoc(){
    return this.navToDoc(this._docMap.dataCheckNotice)
  }

  openInternalApiNotice(){
    return this.navToDoc(this._docMap.imageProcessorTip_1)
  }

  openRemoteApiNotice(){
    return this.navToDoc(this._docMap.imageProcessorTip_2)
  }

  openRememberKeyNotice(){
    return this.navToDoc(this._docMap.rememberKeyNotice)
  }

  openMasterKeyNotice(){
    return this.navToDoc(this._docMap.masterKeyNotice)
  }

  openForgetKeyNotice(){
    return this.navToDoc(this._docMap.forgetKeyNotice)
  }
  // open app doc end

  getUserAvatarDir(){
    return this.getRootPath(`avatar`)
  }
} 