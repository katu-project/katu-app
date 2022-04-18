const utils = require('../utils/index')
const { MASTER_KEY_NAME } = require('../const')

class AppManager {
  static instance = null
  masterKey = null
  static async getInstance(){
    if(!this.instance){
      this.instance = new AppManager()
      await this.instance.loadMasterKey()
    }
    return this.instance
  }

  async loadMasterKey(){
    this.masterKey = await this.readMasterKey()
  }

  async readMasterKey(){
    const {data} = await wx.getStorage({
      key: MASTER_KEY_NAME
    })
    return data
  }
  
  async saveMasterKey(key){
    return wx.setStorage({
      key: MASTER_KEY_NAME,
      data: utils.crypto.sha512(key)
    })
  }
  
}

async function getAppManager(){
  return AppManager.getInstance()
}

module.exports = {
  getAppManager
}