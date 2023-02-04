interface IUser {
  _id: string
  openid: string
  nickName: string
  avatarUrl: string
  isActive: boolean
  status: number
  setMasterKey: boolean
  masterKeyPack: IMasterKeyPack
  recoveryKeyPack: IRecoveryKeyPack
  quota: {
    remain: number
    cardCount: number
    encryptedCardCount: number
  }
  customTag: ICardTag[]
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