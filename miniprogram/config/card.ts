const CardConfig: ICardConfig = {
  defaultTags: [
    { _id: 'dc', name: '储蓄卡', color: '', layout: 'debit_card', field:['cn'] },
    { _id: 'cc', name: '信用卡', color: '', layout: 'credit_card', field:['cn','cvv','ed'] },
    { _id: 'sc', name: '购物卡', color: '' },
    { _id: 'bc', name: '名片', color: '' },
    { _id: 'oc', name: '其他', color: '' }
  ],
  defaultFields: [
    {
      key: 'cn',
      name: '卡号',
      xid: 1
    },
    {
      key: 'cvv',
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
  ],
}

export default CardConfig