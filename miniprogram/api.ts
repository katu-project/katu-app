const request = <T>(action: string, data={}): Promise<T> => {
  const error = {
    code: 0,
    message: ''
  }
  return new Promise((resolve,reject)=>{
    const wxLog = wx.getLogManager({level:1})
    wx.cloud.callFunction({ name: 'api', data: { action, data } })
    .then(({result})=>{
      if(typeof result !== 'object'){
        error.message = '基础请求响应错误: '+ JSON.stringify(result)
        error.code = 500 // 1 业务报错 其他 系统错误
        wxLog.debug(error)
        return reject(error)
      }
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

export default {
  request,
  // sys
  getAppConfig: <T extends keyof AppConfig>(name: T) => request<filterAppConfigItem<T>>('app/config', {name}),
  getDefaultTag: () => request<ICardTag[]>('app/tags'),
  getChangeLog: () => request('app/changeLog'),

  getNotice: (data?:any) => request<Notice>('app/notice', data), 
  // user

  updateUserConfig: (configItem:any) => request('user/updateConfig', configItem),

  updateUserProfile: (data:any) => request('user/updateProfile', data),
  
  deleteTag: (name:string) => request('user/tagDelete', {name}),

  createTag: (name:string) => request('user/tagCreate', {name}),

  updateTag: (tags:any) => request('user/tagUpdate', {tags}),

  getUser: () => request<User>('user/getUser'),

  markRead: (id: string) => request('user/markRead',{id}),

  activeAccount: (data:any) => request('user/active', wx.cloud.CloudID(data.cloudId)),

  removeAccount: () => request('user/removeAccount'),
  
  usageStatistic: () => request<UsageStatistic>('user/usage'),

  setMasterKeyInfo: keyPack => request('user/setMasterKeyInfo',{keyPack}),

  setRecoveryKey: keyPack => request('user/setRecoveryKey',{keyPack}),

  uploadAvatar: async (filePath, url) => {
    const {fileID} = await wx.cloud.uploadFile({
      cloudPath: url,
      filePath
    })
    return fileID
  },
  // card
  getCardSummary: ():Promise<CardSummary[]> => request('card/summary'),

  getLikeCard: ():Promise<Card[]> => request<Card[]>('card/like'),

  setCardLike: data => request('card/setLike', data),

  captureCard: fileID => request<{fileID: string}>('card/capture', {fileId: fileID}),

  getCard: data => request<Card>('card/fetch', data),

  getCardList: data => request<Card[]>('card/fetch', data),

  saveCard: data => request('card/save', data),
  
  deleteCard: id => request('card/delete', id),

  // doc
  getDoc: data => request<Doc>('doc/getDoc', data),

  getHotDoc: () => request('doc/getDoc', {field:{title: true}, where: {type: 2, hot: true}}),

  getCateDoc: cate => request('doc/getDoc', {field:{title: true}, where: {type: 2, cate}})
}