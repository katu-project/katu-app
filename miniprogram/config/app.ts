const AppConfig:IAppConfig = {
  appName: '卡兔',
  icp: '粤ICP备2023001493号',
  contacts:{
    email: 'info@katucloud.com'
  },
  uploadCardType: 'card',
  uploadShareType: 'share',
  uploadUserAvatarType: 'avatar',
  uploadTempFileType: 'temp',
  allowUploadImageType: ['jpeg','png','jpg'],
  cardImageMaxNum: 2,
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
  appEntryPagePath: 'home/index',
  smsCode: [
    { name: 'australia', key: '+61' },
    { name: 'canada', key: '+1' },
    { name: 'china', key: '+86' },
    { name: 'hong_kong', key: '+852' },
    { name: 'japan', key: '+81' },
    { name: 'macau', key: '+853' },
    { name: 'malaysia', key: '+60' },
    { name: 'singapore', key: '+65' },
    { name: 'taiwan', key: '+886' },
    { name: 'united_states', key: '+1' }
  ]
}

export default AppConfig