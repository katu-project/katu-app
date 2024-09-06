const RequestConfig:IRequestConfig = {
  type: 'http',
  cloud: {
    env: '',
    apiName: ''
  },
  http: {
    api: 'https://api.katucloud.com/v3',
    token: '' // 请访问 【 i卡兔 】- 软件设置 - 高级 获取 API 密钥
              // 具体帮助文档请访问 https://katucloud.com/docs#token
  }
}

export default RequestConfig