import { request } from '@/utils/index'

export default {
  // sys
  getAppConfig: <T extends keyof IAppConfig>(name: T) => request<filterAppConfigItem<T>>('app/config', {name}),
  getDefaultTag: () => request<ICardTag[]>('app/tags'),
  getChangeLog: () => request<IChangeLog[]>('app/changeLog'),

  getNotice: (data?:any) => request<INotice>('app/notice', data), 

  getShareItem: (data?:any) => request<IShareItem>('app/share', data),

  setShareItem: (data?:any) => request<IAnyObject>('app/setShare', data),
  // user

  updateUserConfig: (configItem:any) => request('user/updateConfig', configItem),

  updateUserProfile: (data:any) => request('user/updateProfile', data),
  
  deleteTag: (name:string) => request('user/tagDelete', {name}),

  createTag: (name:string) => request('user/tagCreate', {name}),

  updateTag: (tags:any) => request('user/tagUpdate', {tags}),

  getUser: () => request<IUser>('user/getUser'),

  markRead: (id: string) => request('user/markRead',{id}),

  activeAccount: (data:any) => request('user/active', wx.cloud.CloudID(data.cloudId)),

  removeAccount: () => request('user/removeAccount'),
  
  usageStatistic: () => request<IUsageStatistic>('user/usage'),

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
  getCardSummary: () => request<ICardSummary[]>('card/summary'),

  getLikeCard: () => request<ICard[]>('card/like'),

  setCardLike: data => request('card/setLike', data),

  captureCard: fileID => request<{fileID: string}>('card/capture', {fileId: fileID}),

  getCard: data => request<ICard>('card/fetch', data),

  getCardList: data => request<ICard[]>('card/fetch', data),

  saveCard: data => request<ICard>('card/save', data),
  
  deleteCard: id => request('card/delete', id),

  // doc
  getDoc: data => request<IDoc>('doc/getDoc', data),

  getHotDoc: () => request<IAnyObject[]>('doc/getDoc', {field:{title: true}, where: {type: 2, hot: true}}),

  getCateDoc: (cate:string) => request<IAnyObject[]>('doc/getDoc', {field:{title: true}, where: {type: 2, cate}}),

  // data check
  imageContentSafetyCheck: (data:{url:string, hash:string}) => request<{checkEnd:boolean,checkPass:boolean}>('app/imageContentCheck', data),
  textContentSafetyCheck: (data:{text:string}) => request<{checkPass:boolean}>('app/textContentCheck', data)
}