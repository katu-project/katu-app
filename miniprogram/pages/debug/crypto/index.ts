import { crypto } from '@/utils/index'

export {}

Page({
  data: {
    key: '',
    encode: ''
  },
  onLoad(options) {

  },
  GoEncode(){
    const encode = crypto.md5(this.data.key)
    this.setData({
      encode: encode.toString()
    })
  },
  toAes(){
    const key = '1234'
    const encode = crypto.encryptString(this.data.key, key)
    const decode = crypto.decryptString(encode, key)
    this.setData({
      encodeKey: encode,
      decode: decode
    })
  }
})