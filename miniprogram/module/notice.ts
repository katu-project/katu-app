import Base from "@/class/base"
import { LocalCacheKeyMap } from "@/const"

class Notice extends Base {
  constructor(){
    super()
  }

  async init(){
  }

  async _setRead(key, value){
    return this.setLocalData(key, value)
  }

  async _getRead(key){
    const value = await this.getLocalData<boolean>(key)
    return value === undefined ? false : value
  }

  async getKnowEncryptSave(){
    return this._getRead(LocalCacheKeyMap.NOTICE_KNOW_ENCRYPT_SAVE_CACHE_KEY)
  }
  async setKnowEncryptSave(){
    return this._setRead(LocalCacheKeyMap.NOTICE_KNOW_ENCRYPT_SAVE_CACHE_KEY,true)
  }

  async getKnowShareData(){
    return this._getRead(LocalCacheKeyMap.NOTICE_KNOW_SHARE_DATA_CACHE_KEY)
  }
  async setKnowShareData(){
    return this._setRead(LocalCacheKeyMap.NOTICE_KNOW_SHARE_DATA_CACHE_KEY,true)
  }

  async getKnowDataCheck(){
    return this._getRead(LocalCacheKeyMap.NOTICE_KNOW_DATA_CHECK_CACHE_KEY)
  }
  async setKnowDataCheck(){
    return this._setRead(LocalCacheKeyMap.NOTICE_KNOW_DATA_CHECK_CACHE_KEY,true)
  }
}


function getNoticeModule(){
  return Notice.getInstance<Notice>()
}

export {
  getNoticeModule
}