export const AppConfig = {
  uploadCardNamePrefix: 'card',
  allowUploadImageType: ['jpeg','png','jpg'],
  cardImageMaxNum: 2,
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
    icon: 'vipcard',
    color: 'olive',
    name: '额度',
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
  ],
  extraDataLabels: [
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
    }
  ] as ICardLabel[],
  imageMogr2: '&imageMogr2/thumbnail/100x/rquality/80/format/png/interlace/1/strip',
  doc: {
    userUsageProtocol: 'f6e08a6462b0879e08d6b0a15725ecbb',
    userPrivacyProtocol: '6d85a2b962c283280e7a269719a44f88',
    masterKeyNotice: '0a4ec1f9628b5501063149ac75a21cb7',
    rememberKeyNotice: '0a4ec1f962c4f45f0ea61cd706dd10ca',
    imageProcessorTip_1: '0ab5303b62b975a20b880414327d5628',
    imageProcessorTip_2: '058dfefe62b9720f0ad5eca959e4f456',
    forgetKeyNotice: 'f6e08a64628b55a704a899564e10cf2e'
  }
}