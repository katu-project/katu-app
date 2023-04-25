const AppConfig = {
  contacts:{
    email: 'info@katucloud.com'
  },
  uploadCardNamePrefix: 'card',
  uploadShareCardNamePrefix: 'share',
  allowUploadImageType: ['jpeg','png','jpg'],
  cardImageMaxNum: 2,
  devHomeDataCacheTime: 3600000,
  homeDataCacheTime: 86400000,
  qaDocType: [{
    icon: 'apps',
    color: 'green',
    name: '功能',
    value: 'function'
  }, {
    icon: 'settings',
    color: 'cyan',
    name: '设置',
    value: 'setting'
  }, {
    icon: 'people',
    color: 'orange',
    name: '账户',
    value: 'account'
  }, {
    icon: 'safe',
    color: 'red',
    name: '安全',
    value: 'safe'
  }, {
    icon: 'recharge',
    color: 'olive',
    name: '费用',
    value: 'quota'
  }, {
    icon: 'more',
    color: 'blue',
    name: '其他',
    value: 'other'
  }],
  tags: [
    { name: '储蓄卡' },
    { name: '信用卡' },
    { name: '购物卡' },
    { name: '名片' },
    { name: '其他' }
  ] as ICardTag[],
  extraFieldsKeys: [
    {
      key: 'cn',
      name: '卡号',
      xid: 1
    },
    {
      key: 'cvc',
      name: '校验码',
      xid: 2
    },
    {
      key: 'cm',
      name: '联系方式',
      xid: 3
    },
    {
      key: 'ed',
      name: '失效日期',
      xid: 4
    },
    {
      key: 'cu',
      name: '自定义',
      xid: 5
    }
  ] as ICardExtraField[],
  imageMogr2: '&imageMogr2/thumbnail/100x/rquality/80/format/png/interlace/1/strip',
  doc: {
    userUsageProtocol: 'f6e08a6462b0879e08d6b0a15725ecbb',
    userPrivacyProtocol: '6d85a2b962c283280e7a269719a44f88',
    masterKeyNotice: '0a4ec1f9628b5501063149ac75a21cb7',
    rememberKeyNotice: '0a4ec1f962c4f45f0ea61cd706dd10ca',
    imageProcessorTip_1: '0ab5303b62b975a20b880414327d5628',
    imageProcessorTip_2: '058dfefe62b9720f0ad5eca959e4f456',
    forgetKeyNotice: 'f6e08a64628b55a704a899564e10cf2e',
    dataShareNotice: 'ab3f0baf6385c56b01345fff7aab1830',
    dataSaveSecurityNotice: '6d85a2b9628b54c1063d7b093f152106',
    dataCheckNotice: '534fc1e163b68f2700197d67754d9673'
  },
  smsGapTime: 60,
  cryptoConfig: {
    masterKeyLength: 16,
    calculateKeyId: {
      method: 'SHA1',
      length: 20
    },
    userKeyConvert: {
      method: 'SHA1'
    },
    image: {
      hash: 'MD5'
    },
    usePackageVersion: 'v0'
  }
}

export default AppConfig