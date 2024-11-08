/**
 * https://github.com/lucaelin/webdav.js
 */

import { Base64 } from 'js-base64'
import file, { writeFile } from '@/utils/file'

class Client {

  options = {
    server: '',
    username: '',
    password: '',
  }

  authHeader = ''

  constructor(options:ICustomStorageConfig) {
    let server = options.bucket
    if (!server.endsWith('/')) server = server + '/'
    if (!server.startsWith('http')) server = 'https://' + server
    this.options = {
      server,
      username: options.secret.secretId!,
      password: options.secret.secretKey!,
    }
  }

  async get(href) {
    return this.request('GET', href);
  }

  async put(href, data) {
    return this.request('PUT', href, {
      data
    });
  }

  async delete(href) {
    return this.request('DELETE', href)
  }

  async upload(href, filePath) {
    const fileBinary = await file.readFile(filePath)
    return this.request('PUT', href, {
      data: fileBinary,
      header: {
        'content-type': 'application/octet-stream'
      }
    });
  }

  async download(href, savePath) {
    const fileData = await this.request('GET', href, {
      responseType: 'arraybuffer',
      dataType: undefined,
      header: {
        'content-type': 'application/octet-stream'
      }
    })
    await writeFile(savePath, fileData, 'binary')
  }

  async mkdir(href) {
    return this.request('MKCOL', href);
  }

  getAuthHeader() {
    if (!this.authHeader)
      this.authHeader = 'Basic ' + Base64.encode(this.options.username + ':' + this.options.password);
    return this.authHeader;
  }

  async request(method:any, path:string, options?: Partial<WechatMiniprogram.RequestOption>) {
    if (path.startsWith('/')) path = path.slice(1)

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.options.server}${path}`,
        method: method,
        data: options?.data,
        header: {
          Authorization: this.getAuthHeader(),
          ...options?.header,
        },
        responseType: options?.responseType || 'text',
        dataType: options?.dataType || 'json',
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else {
            reject(Error(`WEBDAV Request Error: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          reject(Error(`WEBDAV Request Error: ${err.errMsg}`));
        }
      });
    });
  }
}

export default {
  Client
}