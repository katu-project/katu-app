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
  usedCardCount: number
  usedEncryptedCardCount: number
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