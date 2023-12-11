interface IUser {
  _id: string
  openid: string
  nickName: string
  avatarUrl: string
  isActive: boolean
  identifyCode: string
  status: number
  setMasterKey: boolean
  masterKeyPack: IMasterKeyPack
  miniKeyPack: {
    syncId: string,
    pack: string
  },
  recoveryKeyPack: IResetKeyPack
  quota: {
    remain: number
  }
  contact: {
    tel: string
    email: string
  }
  noticeReadLog: string[]
  config: {
    general: {
      defaultUseEncrytion: boolean
      useDefaultTag: boolean
      autoShowContent: boolean
    },
    account: {

    },
    security: {
      lockOnExit: boolean
      useMiniKey: boolean
      useSyncMiniKey: boolean
      rememberPassword: boolean
      setRecoveryKey: boolean
    }
  }
}

interface IQuotaLog {
  _id: string
  type: string
  createTime: Date
  remainQuota: number
  useQuota: number

  encryptedImageCount: number
  unencryptedImageCount: number

  couponId: string
}

interface ISysConfig {
  active: {
    id: string
    protocols: any[]
    tip: string
  }
}

type filterSysConfigItem<T> = 
    T extends "active" ? ISysConfig['active'] :
    never;

interface IUsageStatistic {
  usedCardCount: number
  usedEncryptedCardCount: number
}