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
  homeDataCacheTime: 86400, // 一天
  noticeFetchTime: 60,
  smsGapTime: 60,
  userInfoCacheTime: 86400,
  shareInfo: {
    title: '卡兔-安全好用的卡片管理助手',
    path: `/pages/home/index`,
    imageUrl: '/static/share.png'
  },
  cacheClearGapTime: 86400, // 一天
  contentCheckHash: 'SHA1',
  imageNameFormatHashMethod: 'MD5',
  appEntryPagePath: 'home/index'
}

export default AppConfig