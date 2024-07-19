import Core from '@/class/core'
import { 
  AppleOrderPayCancelEvent, 
  AppleOrderPayDoneEvent, 
  CacheDeleteEvent, 
  LoginChangeEvent, 
  MasterKeyCacheEvent, 
  MasterKeyRemoveEvent, 
  TagChangeEvent,
  CardHideEvent,
  CardChangeEvent,
  CardDecryptEvent,
  CardDeleteEvent,
  CardEditTitleEvent,
  CardEditExtraDataEvent,
  CardEditImageEvent,
  UserProfileChangeEvent,
  TelCodeSelectedEvent
} from '@/behaviors/event'

export default abstract class Agent extends Core {

  abstract navToDocPage(docId:string): void

  get navDocMap(){
    return this.getDocConfig('docMap')
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

  getUserAvatarDir(){
    return this.getRootPath(`avatar`)
  }

  getLikeCardIds(){
    return this.invokeApi('getCardSummary', 'LikeCardIds') as Promise<string[]>
  }

  getCardIds(){
    return this.invokeApi('getCardSummary', 'CardIds') as Promise<string[]>
  }

  getImageIds(){
    return this.invokeApi('getCardSummary', 'ImageIds') as Promise<string[]>
  }

  getCateList(){
    return this.invokeApi('getCardSummary', 'CateList') as Promise<CateItem[]>
  }

  // event agent 

  publishAppleOrderPayDoneEvent(data){
    this.emit(AppleOrderPayDoneEvent, data)
  }

  publishAppleOrderPayCancelEvent(){
    this.emit(AppleOrderPayCancelEvent)
  }

  publishLoginChangeEvent(data){
    this.emit(LoginChangeEvent, data)
  }

  subscribeMasterKeyCacheEvent(handler){
    this.on(MasterKeyCacheEvent, handler)
  }

  publishMasterKeyCacheEvent(){
    this.emit(MasterKeyCacheEvent)
  }

  subscribeMasterKeyRemoveEvent(handler){
    this.on(MasterKeyRemoveEvent, handler)
  }

  publishMasterKeyRemoveEvent(){
    this.emit(MasterKeyRemoveEvent)
  }

  publishTagChangeEvent(){
    this.emit(TagChangeEvent)
  }

  publishCacheDeleteEvent(){
    this.emit(CacheDeleteEvent)
  }

  publishCardHideEvent(data){
    this.emit(CardHideEvent, data)
  }

  publishCardChangeEvent(data){
    this.emit(CardChangeEvent, data)
  }

  publishCardDecryptEvent(data){
    this.emit(CardDecryptEvent, data)
  }

  publishCardDeleteEvent(data){
    this.emit(CardDeleteEvent, data)
  }

  publishCardEditTitleEvent(data){
    this.emit(CardEditTitleEvent, data)
  }
  
  publishCardEditExtraDataEvent(data){
    this.emit(CardEditExtraDataEvent, data)
  }
  
  publishCardEditImageEvent(data){
    this.emit(CardEditImageEvent, data)
  }

  publishUserProfileChangeEvent(){
    this.emit(UserProfileChangeEvent)
  }

  publishTelCodeSelectedEvent(data){
    this.emit(TelCodeSelectedEvent, data)
  }

  // event agent end
} 