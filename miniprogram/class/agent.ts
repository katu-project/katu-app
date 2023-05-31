import Core from '@/class/core'
import { AppConfig, ColorList, MenuConfig } from '@/config/index'
import ConstData from '@/const'
export default abstract class Agent extends Core {

  abstract uploadFile(filePath:string, uploadType:UploadFileType): Promise<string>

  get defaultCommonCryptoVersion(){
    return AppConfig.crypto.defaultCommonCryptoVersion
  }

  get allowUploadImageType(){
    return AppConfig.allowUploadImageType
  }

  get serviceContactsEmail(){
    return AppConfig.contacts.email
  }

  get defaultUsableTag(){
    return AppConfig.tags
  }

  get defaultUsableImageMaxNum(){
    return AppConfig.cardImageMaxNum
  }

  get defaultExtraFieldsKeys(){
    return AppConfig.extraFieldsKeys
  }

  get qaDocTypeCate(){
    return AppConfig.qaDocType
  }

  get defaultSmsTimeInterval(){
    return AppConfig.smsGapTime
  }

  get shareAppInfo(){
    return AppConfig.shareInfo
  }

  get devHomeDataCacheTime(){
    return AppConfig.devHomeDataCacheTime
  }

  get homeDataCacheTime(){
    return AppConfig.homeDataCacheTime
  }

  get defaultNoticeFetchTimeInterval(){
    return AppConfig.noticeFetchTime
  }

  get cryptoConfig(){
    return AppConfig.crypto
  }

  get tagColorList(){
    return ColorList
  }

  get profileMenus(){
    return MenuConfig.profile
  }

  // const proxy
  get DefaultShowLockImage(){
    return ConstData.DefaultShowLockImage
  }

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

  getUserAvatarDir(){
    return this.getRootPath(`avatar`)
  }
} 