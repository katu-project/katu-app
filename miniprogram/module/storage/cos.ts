const crypto = require('crypto-js')
import { Base64 } from 'js-base64'

function getCloudflareR2Info(key:string, actionId:'GetObject'|'PutObject', config:ICustomStorageConfig){
  const awsMark = 'aws4_request'
  const algorithm = 'AWS4-HMAC-SHA256'
  const time = new Date().toISOString().replace(/[-:\.]/g,'').slice(0,-4)+'Z'
  const date = time.split('T')[0]
  const region = config.region;
  const service = "s3"
  const contentHash = 'UNSIGNED-PAYLOAD'
  const host = `${config.secret.accountId}.r2.cloudflarestorage.com`
  key = key.startsWith('/') ? key : '/' + key
  const requestMethod = {
    GetObject: 'GET',
    PutObject: 'PUT'
  }
  const queryString = [
    `X-Amz-Algorithm=${algorithm}`,
    `X-Amz-Content-Sha256=${contentHash}`,
    `X-Amz-Credential=${config.secret.secretId}%2F${date}%2F${region}%2F${service}%2F${awsMark}`,
    `X-Amz-Date=${time}`,
    "X-Amz-Expires=3600",
    "X-Amz-SignedHeaders=host",
    `x-id=${actionId}`
  ].join('&')
  const requestInfo = [
    requestMethod[actionId],
    key,
    queryString,
    `host:${config.bucket}.${host}`,
    '',
    'host',
    contentHash
  ]
  const requestHash = crypto.SHA256(requestInfo.join('\n')).toString()
  const signString = `${algorithm}\n${time}\n${date}/${region}/${service}/${awsMark}\n${requestHash}`
  const kdate = crypto.HmacSHA256(date, "AWS4"+config.secret.secretKey);
  const kregion = crypto.HmacSHA256(region, kdate);
  const kservice = crypto.HmacSHA256(service, kregion);
  const ksigning = crypto.HmacSHA256(awsMark, kservice);
  const sign = crypto.HmacSHA256(signString, ksigning).toString()
  const url = `https://${config.bucket}.${host}${key}?${queryString}&X-Amz-Signature=${sign}`
  return url
}

function getTencentCosDownloadUrl(key:string, config:ICustomStorageConfig){
  let cosHost = `${config.bucket}.cos.${config.region}.myqcloud.com`
  
  key = key.startsWith('/') ? key : '/' + key
  const ak = config.secret.secretId
  const sk = config.secret.secretKey
  const now = Math.round(Date.now() / 1000)
  const exp = now + 900;
  const qKeyTime = now + ';' + exp
  const qSignAlgorithm = 'sha1'
  const httpString = `get\n${key}\n\n\n`

  const signKey = crypto.HmacSHA1(qKeyTime,sk).toString()
  // const stringToSign = crypto.createHash('sha1').update(policy).digest('hex')
  const stringToSign = `${qSignAlgorithm}\n${qKeyTime}\n${crypto.SHA1(httpString).toString()}\n`
  // const qSignature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex')
  const qSignature = crypto.HmacSHA1(stringToSign,signKey).toString()

  const sign = `q-sign-algorithm=${qSignAlgorithm}&q-ak=${ak}&q-sign-time=${qKeyTime}&q-key-time=${qKeyTime}&q-header-list=&q-url-param-list=&q-signature=${qSignature}`
  const url = 'https://' + cosHost + key + '?' + sign
  return url
}
// 获取签名
function getTencentCosUploadInfo(key:string, config:ICustomStorageConfig) {
  let cosHost = `${config.bucket}.cos.${config.region}.myqcloud.com`
  const ak = config.secret.secretId
  const sk = config.secret.secretKey
  const now = Math.round(Date.now() / 1000)
  const exp = now + 900;
  const qKeyTime = now + ';' + exp
  const qSignAlgorithm = 'sha1'
  const policy = JSON.stringify({
    expiration: new Date(exp * 1000).toISOString(),
    conditions: [
      { 'q-sign-algorithm': qSignAlgorithm },
      { 'q-ak': ak },
      { 'q-sign-time': qKeyTime }
    ]
  })
  // const signKey = crypto.createHmac('sha1', sk).update(qKeyTime).digest('hex')
  const signKey = crypto.HmacSHA1(qKeyTime,sk).toString()
  // const stringToSign = crypto.createHash('sha1').update(policy).digest('hex')
  const stringToSign = crypto.SHA1(policy).toString()
  // const qSignature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex')
  const qSignature = crypto.HmacSHA1(stringToSign,signKey).toString()

  return {
    cosHost,
    url: config.url || 'https://' + cosHost,
    policy,
    qSignAlgorithm: qSignAlgorithm,
    qAk: ak,
    qKeyTime: qKeyTime,
    qSignature: qSignature,
    formData: {
      key,
      success_action_status: 200,
      policy: Base64.encode(policy),
      'Content-Type': '',
      'q-sign-algorithm': qSignAlgorithm,
      'q-ak': ak,
      'q-key-time': qKeyTime,
      'q-signature': qSignature
    }
  }
}

export function getUploadInfo(key:string, config:ICustomStorageConfig){
  switch (config.type) {
    case 'cloudflare.r2':
      return {
        url: getCloudflareR2Info(key,'PutObject', config),
        method: 'PUT'
      }
    case 'tencent.cos':
      return getTencentCosUploadInfo(key, config)
    default:
      throw Error('不支持的存储类型')
  }
}

export function getDownloadInfo(key:string, config:ICustomStorageConfig){
  switch (config.type) {
    case 'cloudflare.r2':
      return getCloudflareR2Info(key, 'GetObject', config)
    case 'tencent.cos':
      return getTencentCosDownloadUrl(key, config)
    default:
      throw Error('不支持的存储类型')
  }
}