const utils = require('../utils/index')

async function generateKeyByMasterKey(){
  const masterKey = await wx.getStorage({
    key: 'KATU_MASTER_KEY',
    encrypt: false
  })
  return utils.crypto.pbkdf2(masterKey)
}

async function saveMasterKey(key){
  return wx.setStorage({
    key: 'KATU_MASTER_KEY',
    data: key,
    encrypt: false
  })
}

module.exports = {
  generateKeyByMasterKey,
  saveMasterKey
}