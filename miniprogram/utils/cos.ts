const crypto = require('crypto-js')
import { Base64 } from 'js-base64'

type CosConfigType = {
  bucket: string,
  region: string,
  secretId?: string,
  secretKey?: string,
  url?:string
}
export function getDownloadUrl(key:string, config:CosConfigType){
  let cosHost = `${config.bucket}.cos.${config.region}.myqcloud.com`
  
  key = key.startsWith('/') ? key : '/' + key
  const ak = config.secretId
  const sk = config.secretKey
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
export function getUploadInfo(key:string, config:CosConfigType) {
  let cosHost = `${config.bucket}.cos.${config.region}.myqcloud.com`
  if(config.url){
    
  }
  const ak = config.secretId
  const sk = config.secretKey
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
};