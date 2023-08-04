const AppConfig:IAppConfig = {
  contacts:{
    email: 'info@katucloud.com'
  },
  uploadCardType: 'card',
  uploadShareType: 'share',
  uploadUserAvatarType: 'avatar',
  uploadTempFileType: 'temp',
  allowUploadImageType: ['jpeg','png','jpg'],
  cardImageMaxNum: 2,
  devHomeDataCacheTime: 3600,
  homeDataCacheTime: 86400,
  noticeFetchTime: 60,
  imageMogr2: '&imageMogr2/thumbnail/100x/rquality/80/format/png/interlace/1/strip',
  smsGapTime: 60,
  crypto: {
    defaultCommonCryptoVersion: 'v0',
    useCommonCryptoVersion: 'v0',
    usePackageVersion: 'v0'
  },
  shareInfo: {
    title: '卡兔-安全好用的卡片管理助手',
    path: `/pages/home/index`,
    imageUrl: '/static/share.png'
  },
  cacheClearGapTime: 86400,
  contentCheckHash: 'SHA1'
}

export default AppConfig