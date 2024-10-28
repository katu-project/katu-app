const CardConfig: ICardConfig = {
  defaultTags: [
    {
      name: 'cc',
      default: true,
      color: '',
      xid: 1,
      layout: 'credit_card',
      field: [ 'cn', 'cvv', 'ed' ]
    },
    {
      name: 'dc',
      default: true,
      color: '',
      xid: 2,
      layout: 'debit_card',
      field: [ 'cn' ]
    },
    { name: 'sc', default: true, color: '', xid: 3},
    { name: 'bc', default: true, color: '', xid: 4 },
    { name: 'oc', default: true, color: '', xid: 5 }
  ],
  defaultFields: [
    {
      key: 'cn',
      xid: 1
    },
    {
      key: 'cvv',
      xid: 2
    },
    {
      key: 'cm',
      xid: 3
    },
    {
      key: 'ed',
      xid: 4
    },
    {
      key: 'cu',
      xid: 5
    }
  ],
}

export default CardConfig