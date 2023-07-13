import { net } from '@/utils/index'
import RequestConfig from "@/config/request"

const { request, upload } = net.createRequest(RequestConfig)

export default {
  // base
  uploadFile: (filePath:string, uploadInfo) => upload('app/upload', {filePath, uploadInfo}),
  // sys
  getSysConfig: <T extends keyof ISysConfig>(name: T) => request<filterSysConfigItem<T>>('app/config', {name}),

  getChangeLog: () => request<IChangeLog[]>('app/changeLog'),

  getNotice: (data?:any) => request<INotice>('app/notice', data),

  getNotices: (data?:any) => request<{sys:INotice[],user:INotice[]}>('app/notices', data),

  getShareItem: (data?:any) => request<IShareItem>('app/share', data),

  setShareItem: (data?:any) => request<IAnyObject>('app/setShare', data),

  sendVerifyCode: (data?:any) => request<{verifyId:string}>('app/sendVerifyCode', data),

  bindTelNumber: data => request('app/bindUserTel', data),

  removeBindTelNumber: data => request('app/removeBindUserTel', data),

  getUploadInfo: data => request<IAnyObject>('app/getUploadInfo', data),

  getContentCheckInfo: data => request<{needCheck:boolean, checkPass:boolean}>('app/getContentCheckInfo', data),
  // user
  updateUserConfig: (configItem:any) => request('user/updateConfig', configItem),

  updateUserProfile: (data:any) => request('user/updateProfile', data),

  getUserQuotaLog: (data) => request<IQuotaLog[]>('user/quotaLog', data),

  getUserQuotaLogDetail: (data) => request<IQuotaLog>('user/quotaLogDetail', data),

  quotaExchange: (data) => request<IQuotaLog>('user/quotaExchange', data),
  
  // user custom tag
  getUserTag: () => request<ICardTag[]>('user/tags', {}),

  deleteTag: (data:{_id:string}) => request('user/tagDelete', data),

  createTag: (name:string) => request<{_id:string,name:string}>('user/tagCreate', {name}),

  updateTag: (tag:Partial<ICardTag>) => request('user/tagUpdate', tag),
  // user custom tag end

  getUser: () => request<IUser>('user/getUser'),

  markRead: (id: string) => request('user/markRead',{id}),

  activeAccount: (data:any) => request('user/active', data),

  removeAccount: () => request('user/removeAccount'),
  
  usageStatistic: () => request<IUsageStatistic>('user/usage'),

  setMasterKeyInfo: keyPack => request('user/setMasterKeyInfo',{keyPack}),

  setRecoveryKey: keyPack => request('user/setRecoveryKey',{keyPack}),

  // card
  getHomeData: () => request<IHomeData>('card/all'),

  getCardSummary: <T extends keyof ICardSummary>(type: T) => request<ICardSummary[T]>('card/summary',{type}),

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