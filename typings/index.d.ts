/// <reference path="./base.d.ts" />
/// <reference path="./types/index.d.ts" />
/// <reference path="./edit.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}

interface IAnyObject {
  [key:string]: any
}

type ICardImage = {
  hash: string,
  url: string,
  salt: string,

  _url?: string
}

interface ICard {
  _id: string
  title: string
  encrypted: boolean
  image: ICardImage[]
  tags: string[]
  info: any[]
  setLike: boolean

  _url?: string
}

interface ICardSummary {
  name: string
  count: number
  color: string
}

interface INotice {
  _id: string
  updateTime: string
  content: string
  auto_show: boolean
}

interface ICardTag {
  name: string

  color?: string
}

interface ICardLabel {
  key: string
  name: string
  xid: number
  value?: string
}

interface IMasterKeyPack {
  keyPack: string
  keyId: string
  hexKeyId: string
}

interface IRecoveryKeyPack {
  createTime: string
  keyId: string
  pack: string
  qrId: string
}

interface IUsageStatistic { 
  canUseCardCount: number 
  canUseEncryptedCardCount: number
  usedCardCount: number
  usedEncryptedCardCount: number
}

interface IUser {
  _id: string
  openid: string
  nickName: string
  avatarUrl: string
  isActive: boolean
  setMasterKey: boolean
  masterKeyPack: IMasterKeyPack
  recoveryKeyPack: IRecoveryKeyPack
  quota: {
    cardCount: number
    encryptedCardCount: number
  }
  customTag: ICardTag[]
  noticeReadLog: string[]
  config: {
    general: {
      defaultUseEncrytion: boolean
      useDefaultTag: boolean
    },
    account: {

    },
    security: {
      lockOnExit: boolean
      rememberPassword: boolean
      setRecoveryKey: boolean
    }
  }
}

interface IDoc {
  _id: string
  title: string
  updateTime: string
  content: string
}

interface IAppConfig {
  active: {
    id: string
    protocols: any[]
    tip: string
  }
}

type filterAppConfigItem<T> = 
    T extends "active" ? IAppConfig['active'] :
    never;

interface IChangeLog extends IAnyObject{
  createTime: string
  desc: string
  pre_release: Boolean
  updateTime: string
  version: string
  _id: string
}