const RequestConfig:IRequestConfig = {
  type: 'http',
  cloud: {
    env: '',
    apiName: ''
  },
  http: {
    api: 'https://api.katucloud.com/v3',
    token: '' // For more information, please visit: https://katucloud.com/docs#token
  }
}

export default RequestConfig