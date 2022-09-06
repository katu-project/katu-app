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
  setLike: boolean
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

type UsageStatistic = { canUseCardCount: number, canUseEncryptedCardCount:number }

type User = {
  _id: string,
  openid: string,
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