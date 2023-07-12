import Module from "@/class/module"

class Notice extends Module {
  lastNoticeFetchTime: number = 0
  noticeFetchIntervalTime: number = 0

  constructor(){
    super()
  }

  init({noticeFetchIntervalTime}){
    this.noticeFetchIntervalTime = noticeFetchIntervalTime
    console.debug('Module Notice inited')
  }

  resetNoticeFetchTime(){
    this.lastNoticeFetchTime = this.currentTimestamp
  }

  checkNeedFetchNotice(){
    try {
      this.checkTimeout(this.lastNoticeFetchTime, this.noticeFetchIntervalTime)
      return false
    } catch (_) {
      return true
    }
  }

  async _getOnceNoticeLog(){
    const sets = await this.getLocalData<{[key:string]:boolean}>('ONCE_NOTICE_CACHE_KEY')
    return sets || {}
  }

  async _setOnceNoticeLog(key, value){
    const sets = await this._getOnceNoticeLog()    
    sets[key] = value
    return this.setLocalData('ONCE_NOTICE_CACHE_KEY', sets)
  }

  async _getOnceNotice(key){
    const sets = await this._getOnceNoticeLog()
    return sets[key] === undefined ? false : sets[key]
  }

  async getKnowEncryptSave(){
    return this._getOnceNotice(this.ONCE_NOTICE_KEYS.ENCRYPT_SAVE)
  }

  async setKnowEncryptSave(){
    return this._setOnceNoticeLog(this.ONCE_NOTICE_KEYS.ENCRYPT_SAVE,true)
  }

  async getKnowShareData(){
    return this._getOnceNotice(this.ONCE_NOTICE_KEYS.SHARE_DATA)
  }

  async setKnowShareData(){
    return this._setOnceNoticeLog(this.ONCE_NOTICE_KEYS.SHARE_DATA,true)
  }

  async getKnowDataCheck(){
    return this._getOnceNotice(this.ONCE_NOTICE_KEYS.DATA_CHECK)
  }

  async setKnowDataCheck(){
    return this._setOnceNoticeLog(this.ONCE_NOTICE_KEYS.DATA_CHECK,true)
  }
}


function getNoticeModule(){
  return Notice.getInstance<Notice>()
}

export {
  getNoticeModule
}