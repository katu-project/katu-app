const utils = require('../utils/index')
const { MASTER_KEY_NAME } = require('../const')

class CryptoManager {
  instance = null
  static async getCryptoManager(){
    if(!this.instance){
      this.instance = new CryptoManager()
      await this.instance.loadMasterKey()
    }
    return this.instance
  }

  async loadMasterKey(){
    this.masterKey = this.readMasterKey()
  }

  async readMasterKey(){
    const {data} = await wx.getStorage({
      key: MASTER_KEY_NAME
    })
    return data
  }
}

async function generateKeyByMasterKey(){
  const masterKey = await wx.getStorage({
    key: MASTER_KEY_NAME
  })
  return utils.crypto.pbkdf2(masterKey)
}



async function saveMasterKey(key){
  return wx.setStorage({
    key: MASTER_KEY_NAME,
    data: utils.crypto.sha512(key)
  })
}

module.exports = {
  generateKeyByMasterKey,
  saveMasterKey,
  readMasterKey
}