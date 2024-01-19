const RequestConfig:IRequestConfig = {
  type: 'http',
  cloud: {
    env: '',
    apiName: ''
  },
  http: {
    api: 'https://api.katucloud.com/v2',
    token: 'KATU_DEMO_TEST' // 请访问【卡兔APP】小程序-软件设置-高级 获取 API 密钥
                            // 具体帮助文档请访问 https://katucloud.com/docs#token
  }
}

export default RequestConfig