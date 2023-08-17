const RequestConfig:IRequestConfig = {
  type: 'http',
  cloud: {
    env: '',
    apiName: ''
  },
  http: {
    baseUrl: 'https://dev.katucloud.com/api',
    token: '' // 请访问【卡兔APP】小程序-软件设置-高级 获取开发者密钥
              // 更多帮助文档请访问 https://dev.katucloud.com/
  }
}

export default RequestConfig