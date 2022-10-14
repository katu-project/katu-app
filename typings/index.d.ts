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
  [key:string]: unknown
}

type CardImage = {
  hash: string,
  url: string,
  salt: string,

  _url?: string
}

type Card = {
  _id: string,
  title: string,
  encrypted: boolean,
  image: CardImage[],
  tags: string[],
  info: any[],
  setLike: boolean,

  _url?: string
}

type CardSummary = {
  name: string,
  count: number,
  color: string
}

type Notice = {
  _id: string,
  updateTime: string,
  content: string,
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

type MasterKeyPack = {
  keyPack: string,
  keyId: string,
  hexKeyId: string
}

type RecoveryKeyPack = {
  createTime: string,
  keyId: string,
  pack: string,
  qrId: string
}

type UsageStatistic = { 
  canUseCardCount: number, 
  canUseEncryptedCardCount:number,
  usedCardCount: number,
  usedEncryptedCardCount: number
}

type User = {
  _id: string,
  openid: string,
  nickName: string,
  avatarUrl: string,
  isActive: boolean,
  setMasterKey: boolean,
  masterKeyPack: MasterKeyPack,
  recoveryKeyPack: RecoveryKeyPack,
  quota: {
    cardCount: number,
    encryptedCardCount: number
  },
  customTag: ICardTag[],
  noticeReadLog: string[],
  config: {
    general: {
      defaultUseEncrytion: boolean,
      useDefaultTag: boolean
    },
    account: {

    },
    security: {
      lockOnExit: boolean,
      rememberPassword: boolean,
      setRecoveryKey: boolean
    }
  }
}

type Doc = {
  _id: string
  title: string
  updateTime: string
  content: string
}

type AppConfig = {
  active: {
    id: string,
    protocols: any[],
    tip: string
  }
}

type filterAppConfigItem<T> = 
    T extends "active" ? AppConfig['active'] :
    never;

interface IChangeLog extends IAnyObject{
  createTime: string
  desc: string
  pre_release: Boolean
  updateTime: string
  version: string
  _id: string
}