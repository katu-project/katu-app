import Core from '@/class/core'
export default abstract class Agent extends Core {

  abstract uploadFile(filePath:string, uploadType:UploadFileType): Promise<string>

  abstract navToDocPage(docId:string): void

  get _docMap(){
    return this.getConfig('doc')
  }

  async getLastSmsSendTime(){
    const value = await this.getLocalData<number>('SMS_LAST_SEND_TIME')
    if(value === undefined) return 0
    return value
  }

  async getLastCacheClearTime(){
    const value = await this.getLocalData<number>('CACHE_CLEAR_TIME')
    if(value === undefined) return 0
    return value
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
    return this.navToDocPage(this._docMap.userUsageProtocol)
  }

  openUserPrivacyProtocol(){
    return this.navToDocPage(this._docMap.userPrivacyProtocol)
  }

  openDataSaveSecurityNoticeDoc(){
    return this.navToDocPage(this._docMap.dataSaveSecurityNotice)
  }

  openDataShareDoc(){
    return this.navToDocPage(this._docMap.dataShareNotice)
  }

  openDataCheckDoc(){
    return this.navToDocPage(this._docMap.dataCheckNotice)
  }

  openInternalApiNotice(){
    return this.navToDocPage(this._docMap.imageProcessorTip_1)
  }

  openRemoteApiNotice(){
    return this.navToDocPage(this._docMap.imageProcessorTip_2)
  }

  openRememberKeyNotice(){
    return this.navToDocPage(this._docMap.rememberKeyNotice)
  }

  openMasterKeyNotice(){
    return this.navToDocPage(this._docMap.masterKeyNotice)
  }

  openForgetKeyNotice(){
    return this.navToDocPage(this._docMap.forgetKeyNotice)
  }
  // open app doc end

  getUserAvatarDir(){
    return this.getRootPath(`avatar`)
  }
} 