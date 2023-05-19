import Core from "@/class/core"
import api from "@/api"
import { LocalCacheKeyMap, ONCE_NOTICE_KEYS } from "@/const"

class Notice extends Core {
  lastNoticeFetchTime: number = 0
  constructor(){
    super()
  }

  async init(){
  }

  resetNoticeFetchTime(){
    this.lastNoticeFetchTime = new Date().getTime()
  }

  checkNeedFetchNotice(){
    const nowTime = new Date().getTime()
    return nowTime - this.lastNoticeFetchTime > 60000
  }

  async fetchNotice(forceFetch?:boolean){
    if(!forceFetch){
      const needFetchNotice = this.checkNeedFetchNotice()
      if(!needFetchNotice){
        return
      }
    }
    const notice = await api.getNotice()
    this.resetNoticeFetchTime()
    return notice
  }

  async _getOnceNoticeLog(){
    const sets = await this.getLocalData<{[key:string]:boolean}>(LocalCacheKeyMap.ONCE_NOTICE_CACHE_KEY)
    return sets || {}
  }

  async _setOnceNoticeLog(key, value){
    const sets = await this._getOnceNoticeLog()    
    sets[key] = value
    return this.setLocalData(LocalCacheKeyMap.ONCE_NOTICE_CACHE_KEY, sets)
  }

  async _getOnceNotice(key){
    const sets = await this._getOnceNoticeLog()
    return sets[key] === undefined ? false : sets[key]
  }

  async getKnowEncryptSave(){
    return this._getOnceNotice(ONCE_NOTICE_KEYS.ENCRYPT_SAVE)
  }
  async setKnowEncryptSave(){
    return this._setOnceNoticeLog(ONCE_NOTICE_KEYS.ENCRYPT_SAVE,true)
  }

  async getKnowShareData(){
    return this._getOnceNotice(ONCE_NOTICE_KEYS.SHARE_DATA)
  }
  async setKnowShareData(){
    return this._setOnceNoticeLog(ONCE_NOTICE_KEYS.SHARE_DATA,true)
  }

  async getKnowDataCheck(){
    return this._getOnceNotice(ONCE_NOTICE_KEYS.DATA_CHECK)
  }
  async setKnowDataCheck(){
    return this._setOnceNoticeLog(ONCE_NOTICE_KEYS.DATA_CHECK,true)
  }
}


function getNoticeModule(){
  return Notice.getInstance<Notice>()
}

export {
  getNoticeModule
}