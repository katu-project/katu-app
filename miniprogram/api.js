
const request = (action, data={}) => {
  const error = {
    code: 0,
    message: ''
  }
  return new Promise((resolve,reject)=>{
    const wxLog = wx.getLogManager()
    wx.cloud.callFunction({ name: 'api', data: { action, data } })
    .then(({result})=>{
      if(result.code === 0){
        resolve(result.data)
      }else{
        error.message = result.msg
        error.code = result.code // 1 业务报错 其他 系统错误
        if(result.code != 1) wxLog.debug(error)
        reject(error)
      }
    })
    .catch(err=>{
      error.message = err.message
      error.code = 600 // 云函数报错
      wxLog.debug(error)
      reject(error)
    })
})
}

module.exports = {
  request,
  // sys
  getAppConfig: name => request('app/config', {name}),
  getDefaultTag: () => request('app/tags'),

  getNotice: () => request('app/notice'), 
  // user

  updateUserConfig: configItem => request('user/updateConfig', configItem),

  deleteTag: name => request('user/tagDelete', {name}),

  createTag: name => request('user/tagCreate', {name}),

  updateTag: tags => request('user/tagUpdate', {tags}),

  getUser: () => request('user/getUser'),

  markRead: id => request('user/markRead',{id}),

  activeAccount: data => request('user/active', wx.cloud.CloudID(data.cloudId)),

  removeAccount: () => request('user/removeAccount'),
  
  usageStatistic: () => request('user/usage'),

  setMasterKeyInfo: keyPack => request('user/setMasterKeyInfo',{keyPack}),
  // card 

  getCardSummary: () => request('card/summary'),

  setCardLike: data => request('card/setLike', data),

  captureCard: fileID => request('card/capture', {fileId: fileID}),

  getCard: data => request('card/fetch', data),

  saveCard: data => request('card/save', data),
  
  deleteCard: id => request('card/delete', id),

  // doc
  getDoc: data => request('doc/getDoc', data),

  getHotDoc: () => request('doc/getDoc', {field:{title: true}, where: {type: 2, hot: true}}),

  getCateDoc: cate => request('doc/getDoc', {field:{title: true}, where: {type: 2, cate}})
}