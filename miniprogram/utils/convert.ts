import { Base64 } from 'js-base64'

export function ArrayBufferToBase64( buffer ){
  let binary = ''
  const bytes = new Uint8Array( buffer )
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
      binary += String.fromCharCode( bytes[ i ] )
  }
  return Base64.btoa(binary)
}

export function Base64ToArrayBuffer(base64) {
  const binary_string = Base64.atob(base64)
  const len = binary_string.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i)
  }
  return bytes.buffer
}

export function BufferToHex(buffer) {
  return [...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
}

export function string2hex(str){
  let result = ""
  for (let i=0; i < str.length; i++) {
      result += str.charCodeAt(i).toString(16).padStart(4,0)
  }
  return result
}

export function hex2string(hex){
  const hexes = hex.match(/.{1,4}/g) || []
  let back = ""
  for(let j = 0; j<hexes.length; j++) {
      back += String.fromCharCode(parseInt(hexes[j], 16))
  }
  return back
}

export function base64ToString(base64String){
  return Base64.decode(base64String)
}

export function stringToBase64(str:string, urlsafe?:boolean){
  return Base64.encode(str, urlsafe)
}

export default {
  ArrayBufferToBase64,
  Base64ToArrayBuffer,
  BufferToHex,
  string2hex,
  hex2string,
  base64ToString,
  stringToBase64
}