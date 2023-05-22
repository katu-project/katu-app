/// <reference path="./base.d.ts" />
/// <reference path="./crypto.d.ts" />
/// <reference path="./user.d.ts" />
/// <reference path="./card.d.ts" />
/// <reference path="./cache.d.ts" />
/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}

interface IAppConfig {
  api: {
    type: 'wxc'|'api',
    baseUrl: string
  },
  contacts: {
    email: string
  }
  uploadCardType: UploadFileType
  uploadShareType: UploadFileType
  uploadUserAvatarType: UploadFileType
  uploadTempFileType: UploadFileType
  allowUploadImageType: string[]
  cardImageMaxNum: number
  devHomeDataCacheTime: number
  homeDataCacheTime: number
  noticeFetchTime: number
  qaDocType: any[]
  tags: Omit<ICardTag,'color'>[]
  extraFieldsKeys: ICardExtraField[]
  imageMogr2: string
  doc: IAnyObject
  smsGapTime: number
  crypto: IAppCryptoConfig
  shareInfo: IAnyObject
}

type UploadFileType = 'share' | 'card' | 'avatar' | 'temp'
interface INotice {
  _id: string
  type: string
  createTime: string
  updateTime: string
  title: string
  content: string
  auto_show: boolean
}

interface IShareItem {
  _id: string
  expiredTime: string
  addTime: string
  endTime: string
  card: Partial<ICard>
}

interface CreateShareOptions {
  card:Partial<ICard>
  scope?: string[]
  expiredTime?: number
}

interface IDoc {
  _id: string
  title: string
  updateTime: string
  content: string
}

interface IChangeLog extends IAnyObject{
  createTime: string
  desc: string
  pre_release: Boolean
  updateTime: string
  version: string
  _id: string
}