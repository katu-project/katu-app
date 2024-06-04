import Core from '@/class/core'
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
} 