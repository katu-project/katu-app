const { Base64 } = require('js-base64')

function ArrayBufferToBase64( buffer ){
  let binary = ''
  const bytes = new Uint8Array( buffer )
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
      binary += String.fromCharCode( bytes[ i ] )
  }
  return Base64.btoa(binary)
}

function Base64ToArrayBuffer(base64) {
  const binary_string = Base64.atob(base64)
  const len = binary_string.length
  const bytes = new Uint8Array(len)
  for (const i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i)
  }
  return bytes.buffer
}

module.exports = {
  ArrayBufferToBase64,
  Base64ToArrayBuffer
}