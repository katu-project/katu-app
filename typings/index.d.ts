/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}

type CardImage = {
  hash: string,
  url: string,
  salt: string
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

type Tag = {
  name: string
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
  customTag: Tag[],
  noticeReadLog: string[],
  config: {
    general: {
      defaultUseEncrytion: number,
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
  _id: string,
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