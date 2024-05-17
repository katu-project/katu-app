import { net } from '@/utils/index'
import RequestConfig from "@/config/request"

const { request, upload, download } = net.createRequest(RequestConfig)

export default {
  // base
  downloadFile: (options:{url:string, savePath:string}) => download('app/download', options),

  uploadFile: (filePath:string, uploadInfo) => upload('app/upload', {filePath, uploadInfo}),
  // sys

  appStatus: () => request('app/status'),

  getSysConfig: <T extends keyof ISysConfig>(name: T) => request<filterSysConfigItem<T>>('app/config', {name}),

  getChangeLog: () => request<IChangeLog[]>('app/changeLog'),

  getIapItems: () => request<{key:string,label:string}[]>('app/iap/list'),

  getHotNotice: (data?:any) => request<INotice>('notice/hot', data),

  getNotices: (data?:any) => request<{sys:INotice[],user:INotice[]}>('notice/list', data),

  getShareItem: (data?:any) => request<IShareItem>('app/share', data),

  setShareItem: (data?:any) => request<IAnyObject>('app/setShare', data),

  getActionSign: (data: {action:string, value:string}) => request<{sign:string}>('app/getSignKey', data),

  sendVerifyCode: (data: {type:'sms'|'email', value:string, sign:string}) => request<{verifyId:string}>('app/sendVerifyCode', data),

  bindTelNumber: data => request('app/bindUserTel', data),

  removeBindTelNumber: data => request('app/removeBindUserTel', data),

  getUploadInfo: data => request<IAnyObject>('app/getUploadInfo', data),

  getContentCheckInfo: data => request<{needCheck:boolean, checkPass:boolean}>('app/getContentCheckInfo', data),
  
  markRead: (id: string) => request('notice/checkin',{id}),

  activeAccount: (data:any) => request('app/active', data),

  getTokenByCode: (code:string) => request('app/code2token', {code}),

  bindOtherLogin: (code:string)=> request('app/bindOtherAccount', {code}),

  unbindOtherLogin: (type:string)=> request('app/unbindOtherAccount', {type}),

  activeAccountWithEmail: (data:{email:string, code:string, verifyId:string}) => request<{token:string}>('app/loginWithEmail', data),

  removeAccount: () => request('app/removeAccount'),

  captureCard: fileID => request<{fileID: string}>('app/capture', {fileId: fileID}),
  // data check
  imageContentSafetyCheck: (data:{url:string, hash:string}) => request<{checkEnd:boolean,checkPass:boolean}>('app/imageContentCheck', data),
  
  textContentSafetyCheck: (data:{text:string}) => request<{checkPass:boolean}>('app/textContentCheck', data),

  getApiToken: () => request<string>('app/getApiToken'),
  
  getUserPrivacyInfo: ()=> request<{title:string, content:string, date:string}>('app/getUserPrivacyNotice'),
  // user
  updateUserConfig: (configItem:any) => request('user/updateConfig', configItem),

  updateUserProfile: (data:any) => request('user/updateProfile', data),
  
  updateUserQuota: (data:any) => request('app/iap', data),

  getUserQuotaLog: (data) => request<IQuotaLog[]>('quota/list', data),

  getUserQuotaLogDetail: (data) => request<IQuotaLog>('quota/info', data),

  quotaExchange: (data) => request<IQuotaLog>('app/exchangeQuota', data),
  
  qrCodelogin: data => request('app/qrcodeLogin', data),

  exportData: data => request('app/exportData', data),

  // user custom tag
  getUserTag: () => request<ICardTag[]>('tag/list', {}),

  deleteTag: (data:{_id:string}) => request('tag/del', data),

  createTag: (name:string) => request<{_id:string,name:string}>('tag/create', {name}),

  updateTag: (tag:Partial<ICardTag>) => request('tag/update', tag),
  // user custom tag end

  getUser: () => request<IUser>('user/info'),
  
  usageStatistic: () => request<IUsageStatistic>('user/usage'),

  setMasterKeyInfo: keyPack => request('user/setMasterKey',{keyPack}),

  setUserMiniKeyInfo: (data?:any) => request('user/setMiniKey',data),

  setRecoveryKey: keyPack => request('user/setRecoveryKey',{keyPack}),

  // card
  getHomeData: () => request<IHomeData>('card/all'),

  getCardSummary: <T extends keyof ICardSummary>(type: T) => request<ICardSummary[T]>('card/summary',{type}),

  getLikeCard: () => request<ICard[]>('card/like'),

  setCardLike: data => request('card/setLike', data),

  getCard: data => request<ICard>('card/fetch', data),

  getCardList: data => request<ICard[]>('card/fetch', data),

  saveCard: data => request<ICard>('card/save', data),
  
  deleteCard: id => request('card/delete', id),

  // doc
  getDoc: data => request<IDoc>('doc/info', data),

  getHotDoc: () => request<IAnyObject[]>('doc/list', {field:{title: true}, where: {type: 2, hot: true}}),

  getCateDoc: (cate:string) => request<IAnyObject[]>('doc/list', {field:{title: true}, where: {type: 2, cate}})
}